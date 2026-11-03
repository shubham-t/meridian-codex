"""Add standard PowerPoint fade transitions and click-driven row builds."""
import zipfile
import xml.etree.ElementTree as E
from pathlib import Path
P='http://schemas.openxmlformats.org/presentationml/2006/main'
A='http://schemas.openxmlformats.org/drawingml/2006/main'
E.register_namespace('p',P);E.register_namespace('a',A)
E.register_namespace('r','http://schemas.openxmlformats.org/officeDocument/2006/relationships')
def el(parent,name,attrs=None):return E.SubElement(parent,'{'+P+'}'+name,attrs or {})
def builds(root,groups):
    timing=el(root,'timing');lst=el(timing,'tnLst');par=el(lst,'par')
    c=el(par,'cTn',{'id':'1','dur':'indefinite','restart':'never','nodeType':'tmRoot'})
    seq=el(el(c,'childTnLst'),'seq',{'concurrent':'1','nextAc':'seek'})
    main=el(seq,'cTn',{'id':'2','dur':'indefinite','nodeType':'mainSeq'})
    children=el(main,'childTnLst');node_id=3
    for group in groups:
        wrapper=el(children,'par');outer=el(wrapper,'cTn',{'id':str(node_id),'fill':'hold'});node_id+=1
        el(el(outer,'stCondLst'),'cond',{'delay':'indefinite'})
        effects=el(outer,'childTnLst')
        for sid in group:
            effect=el(el(effects,'par'),'cTn',{'id':str(node_id),'presetID':'10','presetClass':'entr','presetSubtype':'0','fill':'hold','nodeType':'clickEffect'});node_id+=1
            el(el(effect,'stCondLst'),'cond',{'delay':'0'});effect_children=el(effect,'childTnLst')
            setter=el(effect_children,'set');behavior=el(setter,'cBhvr')
            el(behavior,'cTn',{'id':str(node_id),'dur':'1','fill':'hold'});node_id+=1
            el(el(behavior,'tgtEl'),'spTgt',{'spid':sid})
            el(el(behavior,'attrNameLst'),'attrName').text='style.visibility'
            el(el(setter,'to'),'strVal',{'val':'visible'})
            fade=el(effect_children,'animEffect',{'transition':'in','filter':'fade'})
            behavior=el(fade,'cBhvr');el(behavior,'cTn',{'id':str(node_id),'dur':'400'});node_id+=1
            el(el(behavior,'tgtEl'),'spTgt',{'spid':sid})
    for name,event in [('prevCondLst','onPrev'),('nextCondLst','onNext')]:
        condition=el(el(seq,name),'cond',{'evt':event,'delay':'0'});el(el(condition,'tgtEl'),'sldTgt')
    buildlist=el(timing,'bldLst')
    for group in groups:
        for sid in group:el(buildlist,'bldP',{'spid':sid,'grpId':'0'})

base = Path(__file__).resolve().parents[1] / 'work' / 'presentation'
with zipfile.ZipFile(base/'draft.pptx') as src, zipfile.ZipFile(base/'animated.pptx','w',zipfile.ZIP_DEFLATED) as dst:
    for info in src.infolist():
        data=src.read(info.filename)
        if info.filename.startswith('ppt/slides/slide') and info.filename.endswith('.xml'):
            root=E.fromstring(data)
            transition=E.Element('{'+P+'}transition',{'spd':'med','advClick':'1'});el(transition,'fade')
            root.append(transition)
            number=int(Path(info.filename).stem.replace('slide',''))
            ns={'p':P}
            ids=[s.find('p:nvSpPr/p:cNvPr',ns).get('id') for s in root.findall('.//p:sp',ns)]
            if number==4:builds(root,[ids[2+i*3:5+i*3] for i in range(4)])
            if number==9:builds(root,[ids[2+i*2:4+i*2] for i in range(3)])
            data=E.tostring(root,encoding='utf-8',xml_declaration=True)
        dst.writestr(info,data)
print('Added fade transitions to 18 slides and click builds to slides 4 and 9')
