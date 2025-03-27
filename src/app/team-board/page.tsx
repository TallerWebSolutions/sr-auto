"use client";

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { format, isPast, isToday } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useTeamBoardData,
  type ServiceClass,
  type DemandType,
} from "./useTeamBoardData";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const DEMAND_TYPE_CONFIG = {
  feature: {
    background: "bg-green-100",
    text: "text-green-800",
    border: "border-l-4 border-l-green-500",
    hoverBorder: "hover:border-green-500",
    icon: "❇️",
    description: "New functionality or enhancement"
  },
  chore: {
    background: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-l-4 border-l-yellow-500",
    hoverBorder: "hover:border-yellow-500",
    icon: "🔧",
    description: "Technical task or maintenance work"
  },
  bug: {
    background: "bg-red-100",
    text: "text-red-800",
    border: "border-l-4 border-l-red-500",
    hoverBorder: "hover:border-red-500",
    icon: "🔴",
    description: "Fix for a defect or issue"
  }
};

const SERVICE_CLASS_CONFIG = {
  expedite: {
    background: "bg-red-100",
    text: "text-red-800",
    icon: "🔥",
    description: "Highest priority, bypass regular flow"
  },
  standard: {
    background: "bg-gray-100",
    text: "text-gray-800",
    icon: "📋",
    description: "Normal priority work"
  },
  "fixed-date": {
    background: "bg-gray-100",
    text: "text-gray-800",
    icon: "📅",
    description: "Must be completed by a specific date"
  }
};

const getServiceClassColor = (serviceClass: ServiceClass): string => {
  const config = SERVICE_CLASS_CONFIG[serviceClass];
  return `${config.background} ${config.text}`;
};

const getDemandTypeColor = (type: DemandType): string => {
  const config = DEMAND_TYPE_CONFIG[type];
  return `${config.background} ${config.text}`;
};

const getDemandTypeBorderColor = (type: DemandType): string => {
  return DEMAND_TYPE_CONFIG[type].border;
};

const getDemandTypeHoverBorder = (type: DemandType): string => {
  return DEMAND_TYPE_CONFIG[type].hoverBorder;
};

const getDueDateColor = (dueDate?: Date): string => {
  if (!dueDate) return "";
  if (isPast(dueDate)) return "bg-red-100 text-red-800";
  if (isToday(dueDate)) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
};

const getDemandTypeIcon = (type: DemandType): string => {
  return DEMAND_TYPE_CONFIG[type].icon;
};

const getDemandTypeDescription = (type: DemandType): string => {
  return DEMAND_TYPE_CONFIG[type].description;
};

const getServiceClassIcon = (serviceClass: ServiceClass): string => {
  return SERVICE_CLASS_CONFIG[serviceClass].icon;
};

const getServiceClassDescription = (serviceClass: ServiceClass): string => {
  return SERVICE_CLASS_CONFIG[serviceClass].description;
};

const getAgeingTooltip = (days: number): string => {
  if (days === 0) return "New: Less than 1 day in this column";
  if (days === 1) return "1 day in this column";
  return `${days} days in this column`;
};

/**
 * Determines the appropriate color for an aging dot based on its position and the demand's age
 *
 * Color coding logic:
 * - First dot (index 0): Always gray (visual anchor)
 * - Age 0-1 days: Only gray dots
 * - Age 2-3 days: First dot gray, others yellow (moderate attention)
 * - Age 4-5 days: First dot gray, next two yellow, rest red (needs attention)
 * - Age 6+ days: First dot gray, all others red (urgent attention needed)
 */
const getAgeDotColor = (ageingDays: number, dotIndex: number): string => {
  // First dot is always gray to provide consistent visual anchor
  if (dotIndex === 0) return "bg-gray-300";

  // High aging (6+ days) - urgent attention needed
  if (ageingDays >= 6) return "bg-red-400/80";

  // Medium aging (4-5 days) - needs attention
  if (ageingDays > 3) return dotIndex < 3 ? "bg-yellow-300" : "bg-red-300";

  // Low aging (2-3 days) - moderate attention
  if (ageingDays > 1) return "bg-yellow-300";

  // Very low aging (0-1 days) - no special attention needed
  return "bg-gray-300";
};

const getCardBackgroundColor = (serviceClass: ServiceClass): string => {
  return serviceClass === "expedite" ? "bg-red-50" : "bg-white";
};

const styles = {
  rotate270: {
    transform: "rotate(270deg)",
    transformOrigin: "center",
    whiteSpace: "nowrap",
    marginTop: "50px",
    marginBottom: "50px",
    textAlign: "center" as const
  }
};

export default function TeamBoard() {
  const { columns, updateColumns, isLoading, error, refreshData } =
    useTeamBoardData();
  const [minimizedColumns, setMinimizedColumns] = useState<string[]>([]);

  const toggleColumnMinimized = (columnId: string) => {
    setMinimizedColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(col => col !== columnId)
        : [...prev, columnId]
    );
  };

  const isColumnMinimized = (columnId: string) => {
    return minimizedColumns.includes(columnId);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the source and destination columns and sub-columns
    const sourceColumn = columns.find((col) =>
      col.subColumns.some((subCol) => subCol.id === source.droppableId)
    );
    const destColumn = columns.find((col) =>
      col.subColumns.some((subCol) => subCol.id === destination.droppableId)
    );

    if (!sourceColumn || !destColumn) return;

    const sourceSubColumn = sourceColumn.subColumns.find(
      (subCol) => subCol.id === source.droppableId
    );
    const destSubColumn = destColumn.subColumns.find(
      (subCol) => subCol.id === destination.droppableId
    );

    if (!sourceSubColumn || !destSubColumn) return;

    const sourceDemands = [...sourceSubColumn.demands];
    const destDemands =
      source.droppableId === destination.droppableId
        ? sourceDemands
        : [...destSubColumn.demands];
    const [removed] = sourceDemands.splice(source.index, 1);
    destDemands.splice(destination.index, 0, removed);

    // If moving within the same main column, we only need to update that column
    if (sourceColumn.id === destColumn.id) {
      updateColumns(
        columns.map((col) => {
          if (col.id === sourceColumn.id) {
            return {
              ...col,
              subColumns: col.subColumns.map((subCol) => {
                if (subCol.id === source.droppableId) {
                  return {
                    ...subCol,
                    demands: sourceDemands,
                  };
                }
                if (subCol.id === destination.droppableId) {
                  return {
                    ...subCol,
                    demands: destDemands,
                  };
                }
                return subCol;
              }),
            };
          }
          return col;
        })
      );
    } else {
      // Moving between different main columns
      updateColumns(
        columns.map((col) => {
          if (col.id === sourceColumn.id) {
            return {
              ...col,
              subColumns: col.subColumns.map((subCol) => {
                if (subCol.id === source.droppableId) {
                  return {
                    ...subCol,
                    demands: sourceDemands,
                  };
                }
                return subCol;
              }),
            };
          }
          if (col.id === destColumn.id) {
            return {
              ...col,
              subColumns: col.subColumns.map((subCol) => {
                if (subCol.id === destination.droppableId) {
                  return {
                    ...subCol,
                    demands: destDemands,
                  };
                }
                return subCol;
              }),
            };
          }
          return col;
        })
      );
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">Loading board data...</div>
          <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      <div className="py-6 px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Team Board</h1>
        <button
          onClick={refreshData}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center"
        >
          <span className="mr-1">↻</span> Refresh
        </button>
      </div>

      <TooltipProvider>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden px-8 pb-4">
            <div
              className="flex flex-row gap-4 h-full"
              style={{ minWidth: "max-content" }}
            >
              {columns.map((column) => {
                const isMinimized = isColumnMinimized(column.id);

                if (isMinimized) {
                  return (
                    <div
                      key={column.id}
                      className="bg-gray-50/50 rounded-lg p-2 flex flex-col items-center justify-between"
                      style={{ width: '40px', minHeight: '300px' }}
                    >
                      <button
                        onClick={() => toggleColumnMinimized(column.id)}
                        className="mb-2 p-1 rounded-full hover:bg-gray-200 mt-2"
                        title={`Expandir ${column.title}`}
                      >
                        <ChevronRight size={18} />
                      </button>

                      <div className="flex-grow flex flex-col justify-center">
                        <div style={styles.rotate270} className="font-semibold text-xs">{column.title}</div>
                      </div>

                      <div className="mb-2 mt-auto font-semibold text-xs">
                        ({column.subColumns.reduce((acc, subCol) => acc + subCol.demands.length, 0)})
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={column.id}
                    className="bg-gray-50/50 rounded-lg p-4 flex-shrink-0 flex flex-col h-[calc(100vh-178px)]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-500 text-sm">
                        {column.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {column.subColumns.reduce(
                            (acc, subCol) => acc + subCol.demands.length,
                            0
                          )}
                        </span>
                        <button
                          onClick={() => toggleColumnMinimized(column.id)}
                          className="p-1 rounded-full hover:bg-gray-200"
                          title={`Minimizar ${column.title}`}
                        >
                          <ChevronLeft size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-row gap-4 overflow-y-auto pr-1">
                      {column.subColumns.map((subColumn) => (
                        <div
                          key={subColumn.id}
                          className="flex-1 flex flex-col min-h-0 bg-white rounded-lg shadow-sm"
                          style={{ width: "280px" }}
                        >
                          <div className="p-3 border-b">
                            <h4 className="text-sm font-semibold text-gray-700">
                              {subColumn.title}
                            </h4>
                          </div>
                          <Droppable droppableId={subColumn.id}>
                            {(provided) => (
                              <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="flex-1 overflow-y-auto p-3 rounded-sm"
                              >
                                {subColumn.demands.map((demand, index) => (
                                  <Draggable
                                    key={demand.id}
                                    draggableId={demand.id}
                                    index={index}
                                  >
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`${getCardBackgroundColor(demand.serviceClass)} p-4 mb-4 rounded-lg shadow-sm border ${
                                          demand.isBlocked
                                            ? "border-red-300"
                                            : "border-gray-100"
                                        } ${getDemandTypeBorderColor(demand.type)} ${getDemandTypeHoverBorder(demand.type)} hover:shadow-md cursor-grab active:cursor-grabbing active:shadow-xl`}
                                      >
                                        {/* Header Row with Type/Service Icons and Blocked Indicator */}
                                        <div className="flex items-center justify-between mt-auto">
                                          <div className="flex items-center gap-2">
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span
                                                  className={`text-sm px-1.5 py-0.5 rounded cursor-pointer ${getServiceClassColor(
                                                    demand.serviceClass
                                                  )}`}
                                                >
                                                  {getServiceClassIcon(
                                                    demand.serviceClass
                                                  )}
                                                </span>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>
                                                  <strong>
                                                    {demand.serviceClass
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                      demand.serviceClass.slice(1)}
                                                  </strong>
                                                  <br />
                                                  {getServiceClassDescription(
                                                    demand.serviceClass
                                                  )}
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span
                                                  className={`text-sm px-1.5 py-0.5 rounded cursor-default flex items-center ${getDemandTypeColor(
                                                    demand.type
                                                  )}`}
                                                >
                                                  {getDemandTypeIcon(demand.type)}
                                                  <span className="text-[10px] font-medium ml-1 tracking-wider">
                                                    #{demand.demandId}
                                                  </span>
                                                </span>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>
                                                  <strong>
                                                    {demand.type
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                      demand.type.slice(1)}
                                                  </strong>
                                                  <br />
                                                  {getDemandTypeDescription(
                                                    demand.type
                                                  )}
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </div>

                                          {demand.isBlocked && (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="bg-red-100 text-red-800 p-1 pb-0.5 rounded-lg shadow-sm flex items-center cursor-default">
                                                  <span className="text-sm">🚫</span>
                                                  {demand.blockingDemands &&
                                                    demand.blockingDemands.length >
                                                      0 && (
                                                      <span className="ml-1 text-xs font-bold">
                                                        {demand.blockingDemands.length}
                                                      </span>
                                                    )}
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <div>
                                                  <strong>
                                                    Blocked
                                                    {demand.blockingReason
                                                      ? `: ${demand.blockingReason}`
                                                      : ""}
                                                  </strong>

                                                  {demand.blockingDemands &&
                                                    demand.blockingDemands.length >
                                                      0 && (
                                                      <>
                                                        <div className="mt-1">
                                                          Blocked by{" "}
                                                          {
                                                            demand.blockingDemands
                                                              .length
                                                          }{" "}
                                                          demand
                                                          {demand.blockingDemands
                                                            .length > 1
                                                            ? "s"
                                                            : ""}
                                                          :
                                                        </div>
                                                        <ul className="list-disc pl-4 mt-1">
                                                          {demand.blockingDemands.map(
                                                            (id) => (
                                                              <li key={id}>
                                                                #{id}
                                                              </li>
                                                            )
                                                          )}
                                                        </ul>
                                                      </>
                                                    )}
                                                </div>
                                              </TooltipContent>
                                            </Tooltip>
                                          )}
                                        </div>

                                        {/* Epic Row */}
                                        <div className="mb-1">
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span className="text-xs text-gray-500 truncate max-w-[220px] cursor-default">
                                                {demand.epic}
                                              </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Epic: {demand.epic}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </div>

                                        {/* Demand Title */}
                                        <div className="font-medium mb-7 text-sm">
                                          {demand.title}
                                        </div>

                                        {/* Assignees & Aging */}
                                        <div className="flex items-center justify-between mt-3">
                                          <div className="flex -space-x-1.5">
                                            {demand.assignees?.map((assignee, idx) => (
                                              <Tooltip key={idx}>
                                                <TooltipTrigger asChild>
                                                  <img
                                                    src={assignee.avatar}
                                                    alt={assignee.name}
                                                    className="w-7 h-7 rounded-full border border-white cursor-default"
                                                  />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>{assignee.name}</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            ))}
                                          </div>

                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="flex items-center gap-0.5 cursor-default">
                                                {Array.from({
                                                  length: Math.min(6, demand.ageing),
                                                }).map((_, i) => {
                                                  const dotColor = getAgeDotColor(
                                                    demand.ageing,
                                                    i
                                                  );

                                                  return (
                                                    <div
                                                      key={i}
                                                      className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
                                                    />
                                                  );
                                                })}
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>
                                                <strong>Age indicator</strong>
                                                <br />
                                                {getAgeingTooltip(demand.ageing)}
                                                {demand.ageing >= 3 &&
                                                  " - Needs attention!"}
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </div>

                                        {/* Due Date - if exists */}
                                        {demand.dueDate && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div
                                                className={`mt-4 text-xs px-3 py-1 text-center rounded cursor-default ${getDueDateColor(
                                                  demand.dueDate
                                                )}`}
                                              >
                                                Due: {format(demand.dueDate, "MMM d")}
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>
                                                <strong>Due date</strong>
                                                <br />
                                                {isPast(demand.dueDate)
                                                  ? "Overdue!"
                                                  : isToday(demand.dueDate)
                                                  ? "Due today!"
                                                  : "Upcoming deadline"}
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      </TooltipProvider>
    </div>
  );
}
