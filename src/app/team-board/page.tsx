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

type Task = {
  id: string;
  title: string;
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
  ageing: number;
};

type Column = {
  id: string;
  title: string;
  tasks: Task[];
  group?: string;
};

const getServiceClassColor = (serviceClass: ServiceClass): string => {
  const colors = {
    expedite: "bg-red-100 text-red-800",
    standard: "bg-blue-100 text-blue-800",
    intangible: "bg-purple-100 text-purple-800",
    "fixed-date": "bg-green-100 text-green-800",
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

const initialData: Column[] = [
  {
    id: "backlog",
    title: "Backlog",
    tasks: [
      {
        id: "task-1",
        title: "User profile settings",
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
        epic: "User Management",
        type: "bug",
        serviceClass: "expedite",
        createdAt: new Date("2024-03-25"),
        isBlocked: true,
        ageing: 1,
      },
    ],
    group: "discovery",
  },
  {
    id: "ready-for-analysis",
    title: "Ready for Analysis",
    tasks: [
      {
        id: "task-3",
        title: "Payment gateway integration",
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
    tasks: [
      {
        id: "task-4",
        title: "Product search optimization",
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
    tasks: [
      {
        id: "task-5",
        title: "Mobile app UI redesign",
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
    tasks: [
      {
        id: "task-6",
        title: "Implement user authentication",
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
    tasks: [
      {
        id: "task-8",
        title: "Database optimization",
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
    tasks: [
      {
        id: "task-9",
        title: "User registration endpoint",
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
    tasks: [
      {
        id: "task-10",
        title: "Shopping cart functionality",
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
    tasks: [
      {
        id: "task-11",
        title: "Customer dashboard",
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
    tasks: [
      {
        id: "task-12",
        title: "API documentation",
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
    const sourceTasks = [...sourceColumn!.tasks];
    const destTasks =
      source.droppableId === destination.droppableId
        ? sourceTasks
        : [...destColumn!.tasks];
    const [removed] = sourceTasks.splice(source.index, 1);
    destTasks.splice(destination.index, 0, removed);

    setColumns(
      columns.map((col) => {
        if (col.id === source.droppableId) {
          return {
            ...col,
            tasks: sourceTasks,
          };
        }
        if (col.id === destination.droppableId) {
          return {
            ...col,
            tasks: destTasks,
          };
        }
        return col;
      })
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Team Board</h1>

      <TooltipProvider>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="overflow-x-auto pb-4">
            <div
              className="flex flex-row gap-4"
              style={{ minWidth: "max-content" }}
            >
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="bg-gray-50 rounded-lg p-4 flex-shrink-0"
                  style={{ width: "300px" }}
                >
                  <h3 className="font-semibold mb-4 flex items-center">
                    <span>{column.title}</span>
                    <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                      {column.tasks.length}
                    </span>
                  </h3>
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="min-h-[400px]"
                      >
                        {column.tasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white p-4 mb-4 rounded-lg shadow-sm border ${
                                  task.isBlocked
                                    ? "border-red-200"
                                    : "border-gray-100"
                                } relative`}
                              >
                                {task.isBlocked && (
                                  <div className="absolute top-0 right-0 left-0 bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-t-lg text-center">
                                    BLOCKED
                                  </div>
                                )}

                                {/* Epic & Icons Row */}
                                <div
                                  className={`flex items-center justify-between mb-3 ${
                                    task.isBlocked ? "mt-6" : ""
                                  }`}
                                >
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="text-xs text-gray-500 truncate max-w-[150px] cursor-default">
                                        {task.epic}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Epic: {task.epic}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <div className="flex items-center gap-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span
                                          className={`text-sm px-1.5 py-0.5 rounded cursor-default ${getServiceClassColor(
                                            task.serviceClass
                                          )}`}
                                        >
                                          {getServiceClassIcon(
                                            task.serviceClass
                                          )}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          <strong>
                                            {task.serviceClass
                                              .charAt(0)
                                              .toUpperCase() +
                                              task.serviceClass.slice(1)}
                                          </strong>
                                          <br />
                                          {getServiceClassDescription(
                                            task.serviceClass
                                          )}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span
                                          className={`text-sm px-1.5 py-0.5 rounded cursor-default ${getDemandTypeColor(
                                            task.type
                                          )}`}
                                        >
                                          {getDemandTypeIcon(task.type)}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          <strong>
                                            {task.type.charAt(0).toUpperCase() +
                                              task.type.slice(1)}
                                          </strong>
                                          <br />
                                          {getDemandTypeDescription(task.type)}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>

                                {/* Task Title */}
                                <div className="font-medium mb-4 text-sm">
                                  {task.title}
                                  {task.isBlocked && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="ml-1 text-red-500">
                                          ⚠️
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>This task is blocked</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>

                                {/* Assignees & Aging */}
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex -space-x-1.5">
                                    {task.assignees?.map((assignee, idx) => (
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
                                      <div className="flex items-center gap-1 cursor-default">
                                        {Array.from({
                                          length: task.ageing,
                                        }).map((_, i) => (
                                          <div
                                            key={i}
                                            className={`w-2 h-2 rounded-full ${
                                              i < 1
                                                ? "bg-gray-300"
                                                : i < 3
                                                ? "bg-yellow-300"
                                                : "bg-red-300"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        <strong>Age indicator</strong>
                                        <br />
                                        {getAgeingTooltip(task.ageing)}
                                        {task.ageing >= 3 &&
                                          " - Needs attention!"}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>

                                {/* Due Date - if exists */}
                                {task.dueDate && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={`mt-4 text-xs px-3 py-1 text-center rounded cursor-default ${getDueDateColor(
                                          task.dueDate
                                        )}`}
                                      >
                                        Due: {format(task.dueDate, "MMM d")}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        <strong>Due date</strong>
                                        <br />
                                        {isPast(task.dueDate)
                                          ? "Overdue!"
                                          : isToday(task.dueDate)
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
