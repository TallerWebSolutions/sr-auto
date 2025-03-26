import { useState, useEffect } from "react";

export type ServiceClass =
  | "expedite"
  | "standard"
  | "intangible"
  | "fixed-date";
export type DemandType = "feature" | "chore" | "bug";

export type Demand = {
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

export type Column = {
  id: string;
  title: string;
  demands: Demand[];
  group?: string;
};

const initialBoardData: Column[] = [
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

export const useTeamBoardData = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In the future, this will be an API call
      // const response = await fetch('/api/board-data');
      // const data = await response.json();

      // For now, simulate API delay and use mock data
      await new Promise((resolve) => setTimeout(resolve, 300));

      setColumns(initialBoardData);
    } catch (err) {
      setError("Failed to load board data. Please try again.");
      console.error("Error fetching board data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateColumns = (newColumns: Column[]) => {
    setColumns(newColumns);

    // In the future, this would also persist changes to the backend
    // Example:
    // fetch('/api/update-board', {
    //   method: 'POST',
    //   body: JSON.stringify(newColumns)
    // });
  };

  return {
    columns,
    updateColumns,
    isLoading,
    error,
    refreshData: fetchData,
  };
};
