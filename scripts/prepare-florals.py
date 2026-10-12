"""Inline the existing botanical artwork as independently moving SVG parts."""
from pathlib import Path
import re
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
ET.register_namespace('', 'http://www.w3.org/2000/svg')
NS='{http://www.w3.org/2000/svg}'

def illustration(file, prefix, classes):
 root=ET.fromstring((ROOT/'assets'/file).read_text())
 root.set('class',classes);root.set('aria-hidden','true');root.set('focusable','false')
 # Split the original compound leaf paths without changing their artwork.
 for group in list(root):
  if group.tag != NS+'g': continue
  for node in list(group):
   if node.tag != NS+'path': continue
   d=node.get('d','')
   if d.count('Z') < 4: continue
   index=list(group).index(node); group.remove(node)
   for i,segment in enumerate(re.findall(r'M[^M]+',d)):
    leaf=ET.Element(NS+'g',{'class':'floral-leaf'})
    xy=re.match(r'M([\d.-]+)[ ,]([\d.-]+)',segment)
    if xy: leaf.set('style',f'--pivot:{xy[1]}px {xy[2]}px;--breeze-delay:-{i*.67:.2f}s;--breeze-time:{9+i%4}s')
    ET.SubElement(leaf,NS+'path',{'d':segment});group.insert(index+i,leaf)
 # Blooms sit on their own pivots; their authored translation remains on an inner node.
 candidates=[n for n in root if n.tag==NS+'use']
 candidates += [n for g in root if g.tag==NS+'g' for n in g if n.tag==NS+'g' and n.get('transform','').startswith('translate')]
 for i,node in enumerate(candidates):
  parent=next(p for p in root.iter() if node in list(p));index=list(parent).index(node)
  xy=re.search(r'translate\(([\d.-]+)[ ,]([\d.-]+)\)',node.get('transform',''))
  if not xy: continue
  parent.remove(node)
  wrapper=ET.Element(NS+'g',{'class':'floral-bloom','style':f'--pivot:{xy[1]}px {xy[2]}px;--breeze-delay:-{i*1.7:.1f}s;--breeze-time:{12+i%3}s'})
  wrapper.append(node);parent.insert(index,wrapper)
 # Stem paths remain connected at their base with a very small independent flex.
 first=next((g for g in root if g.tag==NS+'g'),None)
 if first is not None:
  for i,node in enumerate(list(first)):
   if node.tag==NS+'path' and node.get('d','').count('Z')==0:
    xy=re.match(r'M([\d.-]+)[ ,]([\d.-]+)',node.get('d',''))
    if xy:
     node.set('class','floral-stem');node.set('style',f'--pivot:{xy[1]}px {xy[2]}px;--breeze-delay:-{i*1.3}s;--breeze-time:14s')
 text=ET.tostring(root,encoding='unicode')
 ids=re.findall(r'\bid="([^"]+)"',text)
 for old in ids:
  text=text.replace(f'id="{old}"',f'id="{prefix}-{old}"').replace(f'url(#{old})',f'url(#{prefix}-{old})').replace(f'href="#{old}"',f'href="#{prefix}-{old}"')
 return text

html=(ROOT/'index.html').read_text()
for side in ['left','right']:
 marker=f'floral-{side}'
 art=illustration('floral-corner.svg',marker,f'paper-botanical paper-botanical-{side}')
 block=f'<!-- {marker}:start -->{art}<!-- {marker}:end -->'
 pattern=rf'<!-- {marker}:start -->.*?<!-- {marker}:end -->'
 if re.search(pattern,html,flags=re.S): html=re.sub(pattern,lambda _:block,html,flags=re.S)
 else: html=re.sub(rf'<img src="assets/floral-corner.svg" class="paper-botanical paper-botanical-{side}"[^>]*>',lambda _:block,html)
(ROOT/'index.html').write_text(html)
