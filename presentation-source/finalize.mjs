import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skill = process.env.PRESENTATIONS_SKILL_DIR;
const python = process.env.PYTHON_EXECUTABLE;
if (!skill || !python || !process.env.RUNTIME_NODE_MODULES || !process.env.RUNTIME_NODE) {
  throw new Error('Set PRESENTATIONS_SKILL_DIR, PYTHON_EXECUTABLE, RUNTIME_NODE_MODULES, and RUNTIME_NODE to the approved authoring runtime. See presentation-source/README.md.');
}
const {finalizePresentation} = await import(pathToFileURL(path.join(skill, 'container_tools/artifact_tool_utils.mjs')).href);
const dir = path.join(base, 'work/presentation');
const result = await finalizePresentation({
  workspaceDir: base,
  candidatePath: path.join(dir, 'animated.pptx'),
  finalPath: path.join(dir, 'Agent-Harness-Workshop.rebuilt.pptx'),
  pythonExecutable: python,
  integrityValidatorPath: path.join(skill, 'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath: path.join(skill, 'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs: ['--expected-slide-size-emu', '12192000,6858000', '--validate-bullet-geometry', '--validate-heading-fit'],
  explicitTotalSlideCount: 18,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  fontPolicy: {basis: 'design', families: ['Arial', 'Consolas']},
  verifyArtifactToolImport: true,
  receiptPath: path.join(dir, 'validation.json'),
});
console.log(JSON.stringify(result));
