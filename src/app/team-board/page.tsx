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

const getServiceClassColor = (serviceClass: ServiceClass): string => {
  const colors = {
    expedite: "bg-red-100 text-red-800",
    standard: "bg-blue-100 text-blue-800",
    intangible: "bg-purple-100 text-purple-800",
    "fixed-date": "bg-gray-100 text-gray-800",
  };
  return colors[serviceClass];
};

const getDemandTypeColor = (type: DemandType): string => {
  const colors = {
    feature: "bg-blue-100 text-blue-800",
    chore: "bg-gray-100 text-gray-800",
    bug: "bg-red-100 text-red-800",
  };
  return colors[type];
};

const getDueDateColor = (dueDate?: Date): string => {
  if (!dueDate) return "";
  if (isPast(dueDate)) return "bg-red-100 text-red-800";
  if (isToday(dueDate)) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
};

const getDemandTypeIcon = (type: DemandType): string => {
  const icons = {
    feature: "⭐️",
    chore: "🔧",
    bug: "🐛",
  };
  return icons[type];
};

const getDemandTypeDescription = (type: DemandType): string => {
  const descriptions = {
    feature: "New functionality or enhancement",
    chore: "Technical task or maintenance work",
    bug: "Fix for a defect or issue",
  };
  return descriptions[type];
};

const getServiceClassIcon = (serviceClass: ServiceClass): string => {
  const icons = {
    expedite: "🔥",
    standard: "📋",
    intangible: "💡",
    "fixed-date": "📅",
  };
  return icons[serviceClass];
};

const getServiceClassDescription = (serviceClass: ServiceClass): string => {
  const descriptions = {
    expedite: "Highest priority, bypass regular flow",
    standard: "Normal priority work",
    intangible: "Research, design or exploratory work",
    "fixed-date": "Must be completed by a specific date",
  };
  return descriptions[serviceClass];
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

export default function TeamBoard() {
  const { columns, updateColumns, isLoading, error, refreshData } =
    useTeamBoardData();

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destColumn = columns.find(
      (col) => col.id === destination.droppableId
    );
    const sourceDemands = [...sourceColumn!.demands];
    const destDemands =
      source.droppableId === destination.droppableId
        ? sourceDemands
        : [...destColumn!.demands];
    const [removed] = sourceDemands.splice(source.index, 1);
    destDemands.splice(destination.index, 0, removed);

    updateColumns(
      columns.map((col) => {
        if (col.id === source.droppableId) {
          return {
            ...col,
            demands: sourceDemands,
          };
        }
        if (col.id === destination.droppableId) {
          return {
            ...col,
            demands: destDemands,
          };
        }
        return col;
      })
    );
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
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="bg-gray-50 rounded-lg p-4 flex-shrink-0 flex flex-col h-[calc(100vh-178px)]"
                  style={{ width: "300px" }}
                >
                  <h3 className="font-semibold mb-4 flex items-center">
                    <span>{column.title}</span>
                    <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                      {column.demands.length}
                    </span>
                  </h3>
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex-1 overflow-y-auto pr-1"
                      >
                        {column.demands.map((demand, index) => (
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
                                className={`bg-white p-4 mb-4 rounded-lg shadow-sm border ${
                                  demand.isBlocked
                                    ? "border-red-300"
                                    : "border-gray-100"
                                } hover:border-blue-300 hover:shadow-md cursor-grab active:cursor-grabbing active:shadow-xl`}
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
                                                      <li key={id}>#{id}</li>
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
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </div>
        </DragDropContext>
      </TooltipProvider>
    </div>
  );
}
