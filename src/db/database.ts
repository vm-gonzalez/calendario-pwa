import Dexie, { type Table } from "dexie";

export interface Task {
    id?: number;
    title: string;
    description: string;
    date: string;
    color: string;
    status: "pending" | "doing" | "done";
    reminder: boolean;
    createdAt: string;
}

class CalendarDatabase extends Dexie {
    tasks!: Table<Task, number>;

    constructor() {
        super("CalendarDatabase");

        this.version(1).stores({
            tasks: "++id, date, status, createdAt"
        });
    }
}

export const db = new CalendarDatabase();