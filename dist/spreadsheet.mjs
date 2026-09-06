import {listSchemas} from './modules.mjs';

const xmlEscape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
const xmlText=value=>String(value??'').replace(/<[^>]*>/g,'').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&amp;','&');
const sheetNames=Object.fromEntries(Object.keys(listSchemas).map(key=>[key,(listSchemas[key].label||key).replace(/[\\/?*:[\]]/g,' ').slice(0,31)]));

export function toCsv(rows,schema){
  const quote=value=>{const text=String(value??'');return /[",\r\n]/.test(text)?`"${text.replaceAll('"','""')}"`:text;};
  return '\ufeff'+[schema.columns.map(c=>c[1]),...rows.map(row=>schema.columns.map(c=>row[c[0]]??''))].map(row=>row.map(quote).join(',')).join('\r\n');
}

export function fromCsv(text,schema){
  const rows=[];let row=[],cell='',quoted=false;
  text=String(text).replace(/^\ufeff/,'');
  for(let i=0;i<text.length;i++){const ch=text[i];if(quoted){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(ch==='"')quoted=false;else cell+=ch;}else if(ch==='"')quoted=true;else if(ch===','){row.push(cell);cell='';}else if(ch==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=ch;}
  row.push(cell.replace(/\r$/,''));if(row.some(Boolean)||rows.length===0)rows.push(row);
  const headers=rows.shift()||[],indexes=schema.columns.map(c=>headers.findIndex(h=>h.trim().toLowerCase()===c[1].toLowerCase()||h.trim()===c[0]));
  if(indexes.every(i=>i<0))throw new Error(`No recognized columns were found for ${schema.label}.`);
  return rows.filter(r=>r.some(v=>String(v).trim())).map(values=>Object.fromEntries(schema.columns.map((c,i)=>[c[0],indexes[i]<0?'':String(values[indexes[i]]??'').trim()])));
}

const crcTable=(()=>{const table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}return table;})();
const crc32=bytes=>{let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
const le=(value,size)=>{const out=new Uint8Array(size);for(let i=0;i<size;i++)out[i]=(value>>>(i*8))&255;return out;};
const concat=parts=>{const size=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(size);let at=0;for(const part of parts){out.set(part,at);at+=part.length;}return out;};
function zipStore(files){
  const encoder=new TextEncoder(),locals=[],centrals=[];let offset=0;
  for(const [name,content] of Object.entries(files)){const n=encoder.encode(name),data=typeof content==='string'?encoder.encode(content):content,crc=crc32(data);const local=concat([le(0x04034b50,4),le(20,2),le(0,2),le(0,2),le(0,2),le(0,2),le(crc,4),le(data.length,4),le(data.length,4),le(n.length,2),le(0,2),n,data]);locals.push(local);centrals.push(concat([le(0x02014b50,4),le(20,2),le(20,2),le(0,2),le(0,2),le(0,2),le(0,2),le(crc,4),le(data.length,4),le(data.length,4),le(n.length,2),le(0,2),le(0,2),le(0,2),le(0,2),le(0,4),le(offset,4),n]));offset+=local.length;}
  const central=concat(centrals),body=concat(locals);return concat([body,central,le(0x06054b50,4),le(0,2),le(0,2),le(centrals.length,2),le(centrals.length,2),le(central.length,4),le(body.length,4),le(0,2)]);
}
const cellRef=i=>{let name='';for(i++;i;i=Math.floor((i-1)/26))name=String.fromCharCode(65+(i-1)%26)+name;return name;};
function sheetXml(key,rows){const schema=listSchemas[key],all=[schema.columns.map(c=>c[1]),...rows.map(row=>schema.columns.map(c=>row[c[0]]??''))];return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${schema.columns.map((_,i)=>`<col min="${i+1}" max="${i+1}" width="22" customWidth="1"/>`).join('')}</cols><sheetData>${all.map((row,r)=>`<row r="${r+1}">${row.map((value,c)=>`<c r="${cellRef(c)}${r+1}" t="inlineStr"${r===0?' s="1"':''}><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`).join('')}</row>`).join('')}</sheetData><autoFilter ref="A1:${cellRef(schema.columns.length-1)}${Math.max(1,all.length)}"/></worksheet>`;}

export function createWorkbook(lists){
  const keys=Object.keys(listSchemas),files={};
  files['[Content_Types].xml']=`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${keys.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`;
  files['_rels/.rels']='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  files['xl/workbook.xml']=`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${keys.map((key,i)=>`<sheet name="${xmlEscape(sheetNames[key])}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`;
  files['xl/_rels/workbook.xml.rels']=`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${keys.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${keys.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  files['xl/styles.xml']='<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF15557A"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  keys.forEach((key,i)=>files[`xl/worksheets/sheet${i+1}.xml`]=sheetXml(key,lists[key]||[]));
  return new Blob([zipStore(files)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}

const u16=(b,i)=>b[i]|(b[i+1]<<8),u32=(b,i)=>(b[i]|(b[i+1]<<8)|(b[i+2]<<16)|(b[i+3]<<24))>>>0;
async function unzip(buffer){const bytes=new Uint8Array(buffer);let eocd=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(u32(bytes,i)===0x06054b50){eocd=i;break;}if(eocd<0)throw new Error('The workbook ZIP structure is invalid.');const count=u16(bytes,eocd+10),files={};let at=u32(bytes,eocd+16);for(let n=0;n<count;n++){if(u32(bytes,at)!==0x02014b50)throw new Error('The workbook directory is invalid.');const method=u16(bytes,at+10),size=u32(bytes,at+20),nameLen=u16(bytes,at+28),extra=u16(bytes,at+30),comment=u16(bytes,at+32),localAt=u32(bytes,at+42),name=new TextDecoder().decode(bytes.slice(at+46,at+46+nameLen)),localName=u16(bytes,localAt+26),localExtra=u16(bytes,localAt+28),start=localAt+30+localName+localExtra,compressed=bytes.slice(start,start+size);let data;if(method===0)data=compressed;else if(method===8){if(typeof DecompressionStream==='undefined')throw new Error('This browser cannot decompress Excel files.');const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));data=new Uint8Array(await new Response(stream).arrayBuffer());}else throw new Error(`Unsupported Excel compression method ${method}.`);files[name]=new TextDecoder().decode(data);at+=46+nameLen+extra+comment;}return files;}
function parseRows(xml,shared=[]){const rows=[];for(const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)){const cells=[];for(const cell of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)){const ref=cell[1].match(/\br="([A-Z]+)/)?.[1]||'A';let col=0;for(const ch of ref)col=col*26+ch.charCodeAt(0)-64;col--;const type=cell[1].match(/\bt="([^"]+)"/)?.[1],body=cell[2];let value=body.match(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/)?.[1]??body.match(/<v>([\s\S]*?)<\/v>/)?.[1]??'';if(type==='s')value=shared[Number(value)]??'';cells[col]=xmlText(value);}rows.push(cells);}return rows;}
export async function readWorkbook(file){
  const files=await unzip(await file.arrayBuffer()),workbook=files['xl/workbook.xml'];if(!workbook)throw new Error('Workbook metadata is missing.');
  const shared=files['xl/sharedStrings.xml']?[...files['xl/sharedStrings.xml'].matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m=>[...m[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(x=>xmlText(x[1])).join('')):[];
  const names=[...workbook.matchAll(/<sheet\b[^>]*name="([^"]+)"[^>]*\/?\s*>/g)].map(m=>xmlText(m[1])),tables={},warnings=[];
  for(let i=0;i<names.length;i++){const key=Object.keys(sheetNames).find(k=>sheetNames[k].toLowerCase()===names[i].toLowerCase());if(!key){warnings.push(`Ignored unknown sheet: ${names[i]}`);continue;}const xml=files[`xl/worksheets/sheet${i+1}.xml`];if(!xml){warnings.push(`Missing worksheet data: ${names[i]}`);continue;}const rows=parseRows(xml,shared),schema=listSchemas[key],headers=rows.shift()||[],indexes=schema.columns.map(c=>headers.findIndex(h=>String(h).trim().toLowerCase()===c[1].toLowerCase()||h===c[0]));if(indexes.every(n=>n<0)){warnings.push(`No recognized columns in ${names[i]}`);continue;}tables[key]=rows.filter(r=>r.some(Boolean)).map(row=>Object.fromEntries(schema.columns.map((c,x)=>[c[0],String(row[indexes[x]]??'').trim()])));}
  if(!Object.keys(tables).length)throw new Error('No recognized BEP schedules were found in this workbook.');return {tables,warnings};
}

export function mergeRows(current,incoming,schema){const signature=row=>schema.columns.map(c=>String(row[c[0]]??'').trim().toLowerCase()).join('\u241f');const known=new Set(current.map(signature));return [...current,...incoming.filter(row=>{const id=signature(row);if(!id||known.has(id))return false;known.add(id);return true;})];}
export {sheetNames};
