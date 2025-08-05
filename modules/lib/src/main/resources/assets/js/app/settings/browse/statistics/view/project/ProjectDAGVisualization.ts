import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import * as d3 from 'd3';
import * as d3dag from 'd3-dag';
import Q from 'q';
import {Flag} from '../../../../../locale/Flag';
import {ProjectIconUrlResolver} from '../../../../../project/ProjectIconUrlResolver';
import {Project} from '../../../../data/project/Project';
import {ProjectListRequest} from '../../../../resource/ProjectListRequest';

interface DATA {
    id: string
    displayName: string
    iconHTML: string,
    language: string
    parentIds: string[]
    group?: string
}

type D3SVG = d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;

type D3SVGG = d3.Selection<SVGGElement, string, HTMLElement | SVGGElement, unknown>;

export class ProjectDAGVisualization extends DivEl{
    private static TEXTS_LEFT = 45;
    private static NODE_MAX_WIDTH = 200;
    private static MAX_TEXT_WIDTH = ProjectDAGVisualization.NODE_MAX_WIDTH - ProjectDAGVisualization.TEXTS_LEFT;
    private static RECT_HEIGHT = 50;
    private static RECT_LEFT = 60;
    private static RECT_BG_COLOR = '#ffffff';
    private static PATH_COLOR = '#343434';

    private allProjects: Project[];
    private data: DATA[];
    private svgContainerId: string = 'svg-container';

    constructor(projectId?: string) {
        super('project-dag-visualization');
    }

    private createSVGContainer(): DivEl {
        return new DivEl().setId(this.svgContainerId).setClass(this.svgContainerId);
    }

    private createSVG(): D3SVG {
        return d3.select(`#${this.svgContainerId}`).append('svg');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.setData()
            .then(() => {
                this.appendChild(this.createSVGContainer());
                this.execute(this.createSVG());
            })
            .catch((error) => {
                console.log(error);
            });

            return rendered;
        });
    }

    private execute(svgSelection: D3SVG) {
        d3.select(`#${this.svgContainerId}`).attr('style', 'visibility: hidden;');

        const dag = d3dag.dagStratify()(this.data);
        this.setLayout(dag);
        const edges = this.plotEdges(svgSelection, dag.links());
        const nodes = this.plotNodes(svgSelection, dag.descendants());
        const rects = this.plotRects(nodes);
        const displayNames = this.plotProjectDisplayNames(nodes);
        const projectIds = this.plotProjectIds(nodes);
        this.plotTitles(nodes);
        this.plotFlags(nodes);

        setTimeout(() => {
            this.adjustDisplayNames(displayNames);
            this.adjustIds(projectIds);
            this.adjustRects(rects);
            this.adjustEdges(edges);
            this.adjustSvgPlacement(svgSelection, dag);

            d3.select(`#${this.svgContainerId}`).attr('style', 'width: 100%; visibility: visible');
        }, 100);

    }

    private setData(): Q.Promise<void> {
        const getIconHTML = (project: Project) => {
            const language: string = project.getLanguage();

            if (project.getIcon()) {
                const iconUrl: string = new ProjectIconUrlResolver()
                    .setProjectName(project.getName())
                    .setTimestamp(new Date().getTime())
                    .resolve();

                return `<img class="custom-icon" src="${iconUrl}">`;
            }

            let className = new Flag(language).getCountryClass();
            let dataAttr = '';
            if (className !== 'fi-unknown') {
                className = 'flag fi ' + className;
                dataAttr = ` data-code="${language}"`;
            } else {
                className = project.hasParents() ? 'icon-layer' : 'icon-tree-2';
            }

            return `<div class="project-icon ${className}"${dataAttr}></div>`;
        };

        return this.loadAllProjects().then(() => {

            this.data = this.allProjects.map(project => ({
                id: project.getName(),
                displayName: project.getDisplayName(),
                iconHTML: getIconHTML(project),
                language: project.getLanguage() || '',
                parentIds: project.getParents(),
                group: project.getParents().length === 0 ? 'projects' : null
            }));

            return;
        });
    }

    private loadAllProjects(): Q.Promise<Project[]> {
        return new ProjectListRequest(true).sendAndParse().then((projects: Project[]) => this.allProjects = projects);
    }

    //

    private setLayout(dag: d3dag.Dag<DATA, undefined>): {width: number, height: number} {
        const nodeSizeFn = (): [number, number] => {
            return  [
                1.25 * ProjectDAGVisualization.NODE_MAX_WIDTH,
                3 * ProjectDAGVisualization.RECT_HEIGHT
            ];
        };

        // build and apply the layout function using dag as a parameter
        const {width, height} = (
            d3dag.sugiyama()
            .layering(d3dag.layeringSimplex())
            //.layering(d3dag.layeringCoffmanGraham())
            .decross(d3dag.decrossOpt())
            .coord(d3dag.coordCenter())
            .nodeSize(nodeSizeFn)
        )(dag);

        return {width, height};
    }

    private adjustSvgPlacement(svgSelection: D3SVGG, dag: d3dag.Dag<DATA, undefined>) {
        const minXNode = dag.descendants().map((node) => node.x).sort((a,b) => a-b)?.[0] || 0;
        const minXEdge = dag.links()
            .map((link) => link.points.sort((a,b) => a.x - b.x)[0].x)
            .sort((a: number,b: number) => a-b)?.[0] || 0;
        const minYNode = dag.descendants().map((node) => node.y).sort((a,b) => a-b)?.[0] || 0;
        const minYEdge = dag.links()
            .map((link) => link.points.sort((a,b) => a.x - b.x)[0].x)
            .sort((a: number,b: number) => a-b)?.[0] || 0;

        const maxXNode = dag.descendants().map((node) => node.x).sort((a,b) => b-a)?.[0] || 0;
        const maxXEdge = dag.links()
            .map((link) => link.points.sort((a,b) => b.x - a.x)[0].x)
            .sort((a: number,b: number) => b-a)?.[0] || 0;
        const maxYNode = dag.descendants().map((node) => node.y).sort((a,b) => b-a)?.[0] || 0;
        const maxYEdge = dag.links()
            .map((link) => link.points.sort((a,b) => b.x - a.x)[0].x)
            .sort((a: number,b: number) => b-a)?.[0] || 0;

        const minX = Math.max(0, Math.min(minXNode, minXEdge) - ProjectDAGVisualization.NODE_MAX_WIDTH);
        const maxX = Math.max(0, Math.max(maxXNode, maxXEdge) + 2 * ProjectDAGVisualization.NODE_MAX_WIDTH);
        const minY = Math.max(0, Math.min(minYNode, minYEdge) - ProjectDAGVisualization.RECT_HEIGHT);
        const maxY = Math.max(0, Math.min(maxYNode, maxYEdge) + 3 * ProjectDAGVisualization.RECT_HEIGHT);

        svgSelection.attr('viewBox', [minX, minY, maxX, maxY].join(' '));
    }

    private plotEdges(svg: D3SVGG, data: d3dag.DagLink<DATA, undefined>[]): D3SVGG {
        const strokeFn = ({source, target}) => {
            return target.data.parentIds.length > 0 && target.data.parentIds[0] === source.data.id
            ? ProjectDAGVisualization.PATH_COLOR
            : ProjectDAGVisualization.PATH_COLOR + '50';
        };

        return svg.append('g')
            .selectAll('path')
            .data(data)
            .enter()
            .append('path')
            .attr('id', ({source, target}) => encodeURIComponent(`path-${source.data.id}--${target.data.id}`))
            .attr('fill', 'none')
            .attr('stroke', strokeFn);
    }

    private plotNodes(svg: D3SVGG, data: d3dag.DagNode<DATA, undefined>[]): D3SVGG {
        return svg.append('g')
            .selectAll('g')
            .data(data)
            .enter()
            .append('g')
            .attr('transform', ({x, y}) => `translate(${x}, ${y})`);
    }

    private plotTitles(svg: D3SVGG): D3SVGG {
        svg.append('title').text((d) => d.data.id);
    }

    private plotRects(svg: D3SVGG): D3SVGG {
        return svg.append('rect')
            .attr('id', (d) => encodeURIComponent(`rect-${d.data.id}`))
            .attr('height', ProjectDAGVisualization.RECT_HEIGHT)
            .attr('fill', ProjectDAGVisualization.RECT_BG_COLOR)
            .attr('rx', '5')
            .attr('style', 'filter: drop-shadow(0px 1px 2px #e6e6e6)');
    }

    private plotProjectDisplayNames(svg: D3SVGG): D3SVGG {
        const left = ProjectDAGVisualization.TEXTS_LEFT;
        const top = ProjectDAGVisualization.RECT_HEIGHT/ 2.25;

        return svg.append('text')
            .text((d) => d.data.displayName + (d.data.language ? ` (${d.data.language})` : ''))
            .attr('id', (d) => encodeURIComponent(`txt-dn-${d.data.id}`))
            .attr('font-size', '14')
            .attr('font-weight', 'bold')
            .attr('font-family', 'sans-serif')
            .attr('alignment-baseline', 'middle')
            .attr('fill', 'black')
            .attr('style', () => `transform: translate(${left}px, ${top}px)`);
    }

    private plotProjectIds(svg: D3SVGG): D3SVGG {
        const left = ProjectDAGVisualization.TEXTS_LEFT;
        const top = ProjectDAGVisualization.RECT_HEIGHT/ 2.25 + 12.5;

        return svg.append('text')
            .text((d) => d.data.id)
            .attr('id', (d) => encodeURIComponent(`txt-id-${d.data.id}`))
            .attr('font-size', '10')
            .attr('font-family', 'sans-serif')
            .attr('alignment-baseline', 'middle')
            .attr('fill', 'gray')
            .attr('style', () => `transform: translate(${left}px, ${top}px)`);
    }

    private plotFlags(svg: D3SVGG): D3SVGG {
        return svg.append('foreignObject')
            .html(d => d.data.iconHTML)
            .attr('class', 'project-icon-container');
    }

    private adjustDisplayNames(svg: D3SVGG): void {
        const nodes = svg.data();

        nodes.forEach(node => {
            const textId = encodeURIComponent(`txt-dn-${node.data.id}`);

            let textWidth = d3.select(`#${textId}`).node().getComputedTextLength();

            let sliceControl = -1;
            while (textWidth > ProjectDAGVisualization.MAX_TEXT_WIDTH) {
                const lang = node.data.language.slice(0, 10); // avoids infinite loop
                const selection = d3.select(`#${textId}`);
                const updatedText = node.data.displayName.slice(0, sliceControl) + '...' + (lang ? ` (${lang})` : '');
                selection.text(updatedText);
                textWidth = selection.node().getComputedTextLength();
                sliceControl -= 1;
            }
        });
    }

    private adjustIds(svg: D3SVGG): void {
        const nodes = svg.data();

        nodes.forEach(node => {
            const textId = encodeURIComponent(`txt-id-${node.data.id}`);

            let textWidth = d3.select(`#${textId}`).node().getComputedTextLength();

            let sliceControl = -1;
            while (textWidth > ProjectDAGVisualization.MAX_TEXT_WIDTH) {
                const selection = d3.select(`#${textId}`);
                const updatedText = node.data.id.slice(0, sliceControl) + '...';
                selection.text(updatedText);
                textWidth = selection.node().getComputedTextLength();
                sliceControl -= 1;
            }
        });
    }

    private adjustRects(svg: D3SVGG): void {
        const left = ProjectDAGVisualization.RECT_LEFT;

        const adjustmentFn = (d) => {
            const projectDisplayNameTextId = encodeURIComponent(`txt-dn-${d.data.id}`);
            const displayNameTextSize = d3.select(`#${projectDisplayNameTextId}`).node().getComputedTextLength();

            const projectIdTextId = encodeURIComponent(`txt-id-${d.data.id}`);
            const idTextSize = d3.select(`#${projectIdTextId}`).node().getComputedTextLength();

            return left + Math.max(displayNameTextSize, idTextSize);
        };

        svg.attr('width', adjustmentFn);
    }

    private adjustEdges(svg: D3SVGG): void {
        const adjustmentFn = (d) => {
            const sourceX = Math.floor(+document.getElementById(`rect-${d.source.data.id}`).getAttribute('width')) / 2;
            const targetX = Math.floor(+document.getElementById(`rect-${d.target.data.id}`).getAttribute('width')) / 2;

            const points = d.points.map(({x,y}, i) => {
                if (i === 0) {
                return {x: x + sourceX, y: y + ProjectDAGVisualization.RECT_HEIGHT};
                }

                if(i === d.points.length - 1) {
                return {x: x + targetX, y};
                }

                return {x,y};
            });

            return d3
                .line()
                .curve(d3.curveCatmullRom)
                //.curve(d3.curveLinear)
                //.curve(d3.curveStepBefore)
                .x((d) => d.x)
                .y((d) => d.y)(points);
        };

        svg.attr('d', adjustmentFn);
    }
}
