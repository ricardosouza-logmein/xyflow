/*
 * The Handle component is used to connect nodes. When the user mousedowns a handle, we start the connection process.
 * The user can then drag the connection to another handle or node. When the user releases the mouse, we check if the
 * connection is valid and if so, we call the onConnect callback.
 */
import { memo, HTMLAttributes, forwardRef, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import cc from 'classcat';
import { shallow } from 'zustand/shallow';
import {
  errorMessages,
  Position,
  XYHandle,
  getHostForElement,
  isMouseEvent,
  addEdge,
  type HandleProps,
  type Connection,
  type HandleType,
} from '@xyflow/system';

import { useStore, useStoreApi } from '../../hooks/useStore';
import { useNodeId } from '../../contexts/NodeIdContext';
import { type ReactFlowState } from '../../types';

export interface HandleComponentProps extends HandleProps, Omit<HTMLAttributes<HTMLDivElement>, 'id'> {}

const selector = (s: ReactFlowState) => ({
  connectOnClick: s.connectOnClick,
  noPanClassName: s.noPanClassName,
  rfId: s.rfId,
});

const connectingSelector =
  (nodeId: string | null, handleId: string | null, type: HandleType) => (state: ReactFlowState) => {
    const {
      connectionStartHandle: startHandle,
      connectionEndHandle: endHandle,
      connectionClickStartHandle: clickHandle,
    } = state;

    return {
      connecting:
        (startHandle?.nodeId === nodeId && startHandle?.handleId === handleId && startHandle?.type === type) ||
        (endHandle?.nodeId === nodeId && endHandle?.handleId === handleId && endHandle?.type === type),
      clickConnecting:
        clickHandle?.nodeId === nodeId && clickHandle?.handleId === handleId && clickHandle?.type === type,
    };
  };

const HandleComponent = forwardRef<HTMLDivElement, HandleComponentProps>(
  (
    {
      type = 'source',
      position = Position.Top,
      isValidConnection,
      isConnectable = true,
      isConnectableStart = true,
      isConnectableEnd = true,
      id,
      onConnect,
      children,
      className,
      onMouseDown,
      onTouchStart,
      ...rest
    },
    ref
  ) => {
    const handleId = id || null;
    const isTarget = type === 'target';
    const store = useStoreApi();
    const nodeId = useNodeId();
    const { connectOnClick, noPanClassName, rfId } = useStore(selector, shallow);
    const { connecting, clickConnecting } = useStore(connectingSelector(nodeId, handleId, type), shallow);

    if (!nodeId) {
      store.getState().onError?.('010', errorMessages['error010']());
    }

    const onConnectExtended = (params: Connection) => {
      const { defaultEdgeOptions, onConnect: onConnectAction, hasDefaultEdges } = store.getState();

      const edgeParams = {
        ...defaultEdgeOptions,
        ...params,
      };
      if (hasDefaultEdges) {
        const { edges, setEdges } = store.getState();
        setEdges(addEdge(edgeParams, edges));
      }

      onConnectAction?.(edgeParams);
      onConnect?.(edgeParams);
    };

    const onPointerDown = (event: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>) => {
      if (!nodeId) {
        return;
      }

      const isMouseTriggered = isMouseEvent(event.nativeEvent);

      if (
        isConnectableStart &&
        ((isMouseTriggered && (event as ReactMouseEvent<HTMLDivElement>).button === 0) || !isMouseTriggered)
      ) {
        const currentStore = store.getState();

        XYHandle.onPointerDown(event.nativeEvent, {
          autoPanOnConnect: currentStore.autoPanOnConnect,
          connectionMode: currentStore.connectionMode,
          connectionRadius: currentStore.connectionRadius,
          domNode: currentStore.domNode,
          nodes: currentStore.nodes,
          lib: currentStore.lib,
          isTarget,
          handleId,
          nodeId,
          flowId: currentStore.rfId,
          panBy: currentStore.panBy,
          cancelConnection: currentStore.cancelConnection,
          onConnectStart: currentStore.onConnectStart,
          onConnectEnd: currentStore.onConnectEnd,
          updateConnection: currentStore.updateConnection,
          onConnect: onConnectExtended,
          isValidConnection: isValidConnection || currentStore.isValidConnection,
          getTransform: () => store.getState().transform,
        });
      }

      if (isMouseTriggered) {
        onMouseDown?.(event as ReactMouseEvent<HTMLDivElement>);
      } else {
        onTouchStart?.(event as ReactTouchEvent<HTMLDivElement>);
      }
    };

    const onClick = (event: ReactMouseEvent) => {
      const {
        onClickConnectStart,
        onClickConnectEnd,
        connectionClickStartHandle,
        connectionMode,
        isValidConnection: isValidConnectionStore,
        lib,
        rfId: flowId,
      } = store.getState();

      if (!nodeId || (!connectionClickStartHandle && !isConnectableStart)) {
        return;
      }

      if (!connectionClickStartHandle) {
        onClickConnectStart?.(event.nativeEvent, { nodeId, handleId, handleType: type });
        store.setState({ connectionClickStartHandle: { nodeId, type, handleId } });
        return;
      }

      const doc = getHostForElement(event.target as HTMLElement);
      const isValidConnectionHandler = isValidConnection || isValidConnectionStore;
      const { connection, isValid } = XYHandle.isValid(event.nativeEvent, {
        handle: {
          nodeId,
          id: handleId,
          type,
        },
        connectionMode,
        fromNodeId: connectionClickStartHandle.nodeId,
        fromHandleId: connectionClickStartHandle.handleId || null,
        fromType: connectionClickStartHandle.type,
        isValidConnection: isValidConnectionHandler,
        flowId,
        doc,
        lib,
      });

      if (isValid && connection) {
        onConnectExtended(connection);
      }

      onClickConnectEnd?.(event as unknown as MouseEvent);

      store.setState({ connectionClickStartHandle: null });
    };

    return (
      <div
        id={id}
        data-handleid={handleId}
        data-nodeid={nodeId}
        data-handlepos={position}
        data-id={`${rfId}-${nodeId}-${handleId}-${type}`}
        className={cc([
          'react-flow__handle',
          `react-flow__handle-${position}`,
          'nodrag',
          noPanClassName,
          className,
          {
            source: !isTarget,
            target: isTarget,
            connectable: isConnectable,
            connectablestart: isConnectableStart,
            connectableend: isConnectableEnd,
            connecting: clickConnecting,
            // this class is used to style the handle when the user is connecting
            connectionindicator:
              isConnectable && ((isConnectableStart && !connecting) || (isConnectableEnd && connecting)),
          },
        ])}
        onMouseDown={onPointerDown}
        onTouchStart={onPointerDown}
        onClick={connectOnClick ? onClick : undefined}
        ref={ref}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

HandleComponent.displayName = 'Handle';

/**
 * The Handle component is the part of a node that can be used to connect nodes.
 */
export const Handle = memo(HandleComponent);
