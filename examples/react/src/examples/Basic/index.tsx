import { MouseEvent, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  Controls,
  ReactFlowProvider,
  Node,
  Edge,
  useReactFlow,
  Panel,
  OnNodeDrag,
} from '@xyflow/react';

const onNodeDrag: OnNodeDrag = (_, node) => console.log('drag', node);
const onNodeDragStop = (_: MouseEvent, node: Node) => console.log('drag stop', node);
const onNodeClick = (_: MouseEvent, node: Node) => console.log('click', node);

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Node 1' },
    position: { x: 250, y: 5 },
    className: 'light',
  },
  {
    id: '2',
    data: { label: 'Node 2' },
    position: { x: 100, y: 100 },
    className: 'light',
  },
  {
    id: '3',
    data: { label: 'Node 3' },
    position: { x: 400, y: 100 },
    className: 'light',
  },
  {
    id: '4',
    data: { label: 'Node 4' },
    position: { x: 400, y: 200 },
    className: 'light',
    connectable: false,
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3' },
];

const defaultEdgeOptions = {};

const BasicFlow = () => {
  const { setNodes, getNodes, setEdges, getEdges, deleteElements, updateNodeData, toObject, setViewport } =
    useReactFlow();

  const updatePos = () => {
    setNodes((nodes) =>
      nodes.map((node) => {
        node.position = {
          x: Math.random() * 400,
          y: Math.random() * 400,
        };

        return node;
      })
    );
  };

  const logToObject = () => console.log(toObject());
  const resetTransform = () => setViewport({ x: 0, y: 0, zoom: 1 });

  const toggleClassnames = () => {
    setNodes((nodes) =>
      nodes.map((node) => {
        node.className = node.className === 'light' ? 'dark' : 'light';

        return node;
      })
    );
  };

  const deleteSelectedElements = useCallback(() => {
    const selectedNodes = getNodes().filter((node) => node.selected);
    const selectedEdges = getEdges().filter((edge) => edge.selected);
    deleteElements({ nodes: selectedNodes, edges: selectedEdges });
  }, [deleteElements]);

  const deleteSomeElements = useCallback(() => {
    deleteElements({ nodes: [{ id: '2' }], edges: [{ id: 'e1-3' }] });
  }, []);

  const onSetNodes = () => {
    setNodes([
      { id: 'a', position: { x: 0, y: 0 }, data: { label: 'Node a' } },
      { id: 'b', position: { x: 0, y: 150 }, data: { label: 'Node b' } },
    ]);

    setEdges([{ id: 'a-b', source: 'a', target: 'b' }]);
  };

  const onUpdateNode = () => {
    updateNodeData('1', { label: 'update' });
    updateNodeData('2', { label: 'update' });
  };

  return (
    <ReactFlow
      defaultNodes={initialNodes}
      defaultEdges={initialEdges}
      onNodeClick={onNodeClick}
      onNodeDragStop={onNodeDragStop}
      onNodeDrag={onNodeDrag}
      className="react-flow-basic-example"
      minZoom={0.2}
      maxZoom={4}
      fitView
      defaultEdgeOptions={defaultEdgeOptions}
      selectNodesOnDrag={false}
      elevateEdgesOnSelect
      elevateNodesOnSelect={false}
    >
      <Background variant={BackgroundVariant.Dots} />
      <MiniMap />
      <Controls />

      <Panel position="top-right">
        <button onClick={resetTransform}>reset transform</button>
        <button onClick={updatePos}>change pos</button>
        <button onClick={toggleClassnames}>toggle classnames</button>
        <button onClick={logToObject}>toObject</button>

        <button onClick={deleteSelectedElements}>deleteSelectedElements</button>
        <button onClick={deleteSomeElements}>deleteSomeElements</button>
        <button onClick={onSetNodes}>setNodes</button>
        <button onClick={onUpdateNode}>updateNode</button>
      </Panel>
    </ReactFlow>
  );
};

export default function App() {
  return (
    <ReactFlowProvider>
      <BasicFlow />
    </ReactFlowProvider>
  );
}
