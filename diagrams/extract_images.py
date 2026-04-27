from docx import Document
import glob, os

files = glob.glob(r'C:\Users\egor\Downloads\Telegram Desktop\Спецификация*.docx')
doc = Document(files[0])
out_dir = r'C:\Users\egor\Desktop\stanok\diagrams\spec_images'
os.makedirs(out_dir, exist_ok=True)

count = 0
for i, rel in doc.part.rels.items():
    rtype = rel.reltype
    if 'image' in str(rtype):
        ext = rel.target_ref.split('.')[-1] if '.' in rel.target_ref else 'png'
        fname = os.path.join(out_dir, f'image_{count:02d}.{ext}')
        with open(fname, 'wb') as f:
            f.write(rel.target_part.blob)
        count += 1
        print(f'Extracted: {fname}')

print(f'Total images: {count}')
