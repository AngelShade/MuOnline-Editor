# This file creates  Skill_ListFixed with Reqlevel = " X " whatever you want 
import xml.etree.ElementTree as ET

input_file  = "SkillList.xml"
output_file = "SkillList_fixed.xml"

tree = ET.parse(input_file)
root = tree.getroot()

changed = 0
for skill in root.findall(".//Skill"):
    if skill.attrib.get("ReqLevel") != "0":          # <-- skip if 0
        skill.set("ReqLevel", "1")           # <-- Change "1" to whatever level you want and it will apply that level
        changed += 1

tree.write(output_file, encoding="utf-8", xml_declaration=True)
print(f"Done! {changed} skills set to ReqLevel=\"1\" (skills with 0 were skipped).")
print(f"Output saved as: {output_file}")