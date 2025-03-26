"use client";

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ServiceClass = "expedite" | "standard" | "intangible" | "fixed-date";
type DemandType = "feature" | "chore" | "bug";

type Demand = {
  id: string;
  title: string;
  demandId: string;
  epic: string;
  type: DemandType;
  serviceClass: ServiceClass;
  assignees?: {
    name: string;
    avatar: string;
  }[];
  createdAt: Date;
  dueDate?: Date;
  isBlocked: boolean;
  blockingReason?: string;
  blockingDemands?: string[];
  ageing: number;
};

type Column = {
  id: string;
  title: string;
  demands: Demand[];
  group?: string;
};

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
  if (ageingDays >= 6) return "bg-red-300";

  // Medium aging (4-5 days) - needs attention
  if (ageingDays > 3) return dotIndex < 3 ? "bg-yellow-300" : "bg-red-300";

  // Low aging (2-3 days) - moderate attention
  if (ageingDays > 1) return "bg-yellow-300";

  // Very low aging (0-1 days) - no special attention needed
  return "bg-gray-300";
};

const initialData: Column[] = [
  {
    id: "backlog",
    title: "Backlog",
    demands: [
      {
        id: "task-1",
        title: "User profile settings",
        demandId: "PRL-203",
        epic: "User Management",
        type: "feature",
        serviceClass: "standard",
        createdAt: new Date("2024-03-15"),
        isBlocked: false,
        ageing: 11,
      },
      {
        id: "task-2",
        title: "Fix login page crash",
        demandId: "PRL-204",
        epic: "User Management",
        type: "bug",
        serviceClass: "expedite",
        createdAt: new Date("2024-03-25"),
        isBlocked: true,
        blockingReason: "Waiting for API update",
        blockingDemands: ["API-227", "PERF-118"],
        ageing: 1,
      },
    ],
    group: "discovery",
  },
  {
    id: "ready-for-analysis",
    title: "Ready for Analysis",
    demands: [
      {
        id: "task-3",
        title: "Payment gateway integration",
        demandId: "CHK-101",
        epic: "Checkout",
        type: "feature",
        serviceClass: "fixed-date",
        createdAt: new Date("2024-03-20"),
        dueDate: new Date("2024-04-15"),
        isBlocked: false,
        ageing: 6,
      },
    ],
    group: "discovery",
  },
  {
    id: "in-analysis",
    title: "In Analysis",
    demands: [
      {
        id: "task-4",
        title: "Product search optimization",
        demandId: "SRC-427",
        epic: "Search",
        type: "feature",
        serviceClass: "standard",
        assignees: [
          {
            name: "Alice Cooper",
            avatar: "https://ui-avatars.com/api/?name=Alice+Cooper",
          },
        ],
        createdAt: new Date("2024-03-22"),
        isBlocked: false,
        ageing: 4,
      },
    ],
    group: "discovery",
  },
  {
    id: "options",
    title: "Options",
    demands: [
      {
        id: "task-5",
        title: "Mobile app UI redesign",
        demandId: "MOB-155",
        epic: "Mobile Experience",
        type: "feature",
        serviceClass: "intangible",
        assignees: [
          {
            name: "Bob Smith",
            avatar: "https://ui-avatars.com/api/?name=Bob+Smith",
          },
        ],
        createdAt: new Date("2024-03-18"),
        isBlocked: false,
        ageing: 8,
      },
    ],
    group: "discovery",
  },
  {
    id: "ready-for-dev",
    title: "Ready for Dev",
    demands: [
      {
        id: "task-6",
        title: "Implement user authentication",
        demandId: "AUTH-320",
        epic: "User Management",
        type: "feature",
        serviceClass: "standard",
        createdAt: new Date("2024-03-21"),
        isBlocked: false,
        ageing: 5,
      },
      {
        id: "task-7",
        title: "Fix registration form validation",
        demandId: "AUTH-321",
        epic: "User Management",
        type: "bug",
        serviceClass: "expedite",
        createdAt: new Date("2024-03-24"),
        isBlocked: false,
        ageing: 2,
      },
    ],
    group: "development",
  },
  {
    id: "in-dev",
    title: "In Development",
    demands: [
      {
        id: "task-8",
        title: "Database optimization",
        demandId: "PERF-118",
        epic: "Performance",
        type: "chore",
        serviceClass: "intangible",
        assignees: [
          {
            name: "John Doe",
            avatar: "https://ui-avatars.com/api/?name=John+Doe",
          },
          {
            name: "Alice Cooper",
            avatar: "https://ui-avatars.com/api/?name=Alice+Cooper",
          },
        ],
        createdAt: new Date("2024-03-22"),
        dueDate: new Date("2024-03-28"),
        isBlocked: false,
        ageing: 4,
      },
    ],
    group: "development",
  },
  {
    id: "ready-for-review",
    title: "Ready for Review",
    demands: [
      {
        id: "task-9",
        title: "User registration endpoint",
        demandId: "API-227",
        epic: "API Development",
        type: "feature",
        serviceClass: "standard",
        assignees: [
          {
            name: "Emily Davis",
            avatar: "https://ui-avatars.com/api/?name=Emily+Davis",
          },
        ],
        createdAt: new Date("2024-03-19"),
        isBlocked: false,
        ageing: 7,
      },
    ],
    group: "review",
  },
  {
    id: "in-review",
    title: "In Review",
    demands: [
      {
        id: "task-10",
        title: "Shopping cart functionality",
        demandId: "CHK-103",
        epic: "Checkout",
        type: "feature",
        serviceClass: "standard",
        assignees: [
          {
            name: "Michael Johnson",
            avatar: "https://ui-avatars.com/api/?name=Michael+Johnson",
          },
        ],
        createdAt: new Date("2024-03-23"),
        isBlocked: false,
        ageing: 3,
      },
    ],
    group: "review",
  },
  {
    id: "ready-for-deploy",
    title: "Ready for Deploy",
    demands: [
      {
        id: "task-11",
        title: "Customer dashboard",
        demandId: "USR-099",
        epic: "User Management",
        type: "feature",
        serviceClass: "fixed-date",
        assignees: [
          {
            name: "Sarah Williams",
            avatar: "https://ui-avatars.com/api/?name=Sarah+Williams",
          },
        ],
        createdAt: new Date("2024-03-17"),
        dueDate: new Date("2024-03-27"),
        isBlocked: false,
        ageing: 9,
      },
    ],
    group: "deployment",
  },
  {
    id: "done",
    title: "Done",
    demands: [
      {
        id: "task-12",
        title: "API documentation",
        demandId: "DOC-435",
        epic: "Documentation",
        type: "chore",
        serviceClass: "standard",
        assignees: [
          {
            name: "Jane Smith",
            avatar: "https://ui-avatars.com/api/?name=Jane+Smith",
          },
        ],
        createdAt: new Date("2024-03-15"),
        isBlocked: false,
        ageing: 11,
      },
      {
        id: "task-13",
        title: "Password reset functionality",
        demandId: "USR-105",
        epic: "User Management",
        type: "feature",
        serviceClass: "standard",
        assignees: [
          {
            name: "David Brown",
            avatar: "https://ui-avatars.com/api/?name=David+Brown",
          },
        ],
        createdAt: new Date("2024-03-16"),
        isBlocked: false,
        ageing: 10,
      },
    ],
    group: "deployment",
  },
];

export default function TeamBoard() {
  const [columns, setColumns] = useState<Column[]>(initialData);

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

    setColumns(
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

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      <div className="py-6 px-8">
        <h1 className="text-2xl font-bold">Team Board</h1>
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
                                }`}
                              >
                                {/* Header Row with Type/Service Icons and Blocked Indicator */}
                                <div className="flex items-center justify-between mt-auto">
                                  <div className="flex items-center gap-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span
                                          className={`text-sm px-1.5 py-0.5 rounded cursor-default ${getServiceClassColor(
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
                                        <div className="bg-red-100 text-red-800 p-1 pb-0 rounded-lg shadow-sm flex items-center cursor-default">
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
