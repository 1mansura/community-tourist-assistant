# Architecture diagrams (PlantUML)

All architecture diagrams for the **Community Tourist Assistant** project are defined in PlantUML (`.puml`) in **this folder** at the **repository root** (alongside `backend/`, `frontend/`).

**Report-ready exports:** PNGs committed under **`images/`** are the final figures for coursework; regenerate only if you edit `.puml` sources.

## Diagram list

| File | Description | Report section |
|------|-------------|----------------|
| `high-level-architecture.puml` | High-level system view (actors, frontend, backend, data) | Optional intro |
| `c4-container.puml` | C4 Level 2 container diagram | **1.5.2** |
| `backend-component-architecture.puml` | Django backend components | **1.5.3** |
| `architecture_wiring.puml` | Frontend: page-to-component wiring | **1.5.4** |
| `architecture_layers.puml` | Frontend: layer overview (pages, contexts, services, externals) | **1.5.4** |
| `data-model.puml` | Entity-relationship (data model) | **1.5.5** |
| `deployment-architecture.puml` | Deployment (Docker Compose / C4 deployment) | **1.5.6** |
| `asset-moderation-sequence.puml` | Sequence: submit asset → admin moderation | **1.5.7** |

## Generating images

Generated PNGs (or SVGs) go in **`architecture/images/`**.

### Option 1: PlantUML JAR

1. Download the PlantUML jar from [plantuml.com](https://plantuml.com/download) and save as `plantuml.jar` at the repo root (or set `PLANTUML_JAR`).
2. From this folder, run:
   ```bash
   java -jar /path/to/plantuml.jar -tpng -o images *.puml
   ```

### Option 2: Docker

```bash
docker run --rm -v "$(pwd)/architecture:/data" plantuml/plantuml -tpng -o images /data/\*.puml
```
(Run with `pwd` = repository root.)

### Option 3: Online / VS Code

- Paste a `.puml` file into [PlantUML Online](https://www.plantuml.com/plantuml/uml/) and export PNG/SVG.
- Or use a VS Code extension (e.g. “PlantUML”) to preview and export.

**Note:** `deployment-architecture.puml` includes the C4-PlantUML deployment library from the internet. For offline use, download [C4_Deployment.puml](https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Deployment.puml) and use `!include path/to/C4_Deployment.puml` instead.

## Report workflow

1. Generate PNGs using one of the options above.
2. Insert the images into your report where indicated.

Source of truth for diagram content is the `.puml` files in this folder.
