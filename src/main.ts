import "./style.css";
import { db, type Task } from "./db/database";

const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
];

const dayNames = [
    "Lun",
    "Mar",
    "Mié",
    "Jue",
    "Vie",
    "Sáb",
    "Dom"
];

const taskColors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#3b82f6",
    "#8b5cf6"
];

let currentDate = new Date();

let taskPendingDeletion: number | undefined;


/* =========================================================
   FECHAS
========================================================= */

function formatDate(
    year: number,
    month: number,
    day: number
): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDisplayDate(
    date: string
): string {
    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year}`;
}

function getPrettyDate(
    date: string
): string {
    const [year, month, day] = date.split("-");

    const parsedDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    );

    return parsedDate.toLocaleDateString(
        "es-ES",
        {
            weekday: "long",
            day: "numeric",
            month: "long"
        }
    );
}


/* =========================================================
   ESTADOS
========================================================= */

function getStatusLabel(
    status: Task["status"]
): string {
    switch (status) {
        case "pending":
            return "Pendiente";

        case "doing":
            return "En proceso";

        case "done":
            return "Completada";
    }
}

function getNextStatus(
    status: Task["status"]
): Task["status"] {
    switch (status) {
        case "pending":
            return "doing";

        case "doing":
            return "done";

        case "done":
            return "pending";
    }
}

function getStatusSymbol(
    status: Task["status"]
): string {
    switch (status) {
        case "pending":
            return "🟡";

        case "doing":
            return "🔵";

        case "done":
            return "🟢";
    }
}


/* =========================================================
   SEGURIDAD HTML
========================================================= */

function escapeHtml(
    text: string
): string {
    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


/* =========================================================
   RENDER CALENDARIO
========================================================= */

async function renderCalendar(): Promise<void> {
    const app =
        document.querySelector<HTMLDivElement>("#app");

    if (!app) {
        throw new Error(
            "No se encontró el elemento #app"
        );
    }

    const year =
        currentDate.getFullYear();

    const month =
        currentDate.getMonth();

    const firstDay =
        new Date(year, month, 1);

    const lastDay =
        new Date(year, month + 1, 0);

    const startDay =
        (firstDay.getDay() + 6) % 7;

    const totalDays =
        lastDay.getDate();

    const tasks =
        await db.tasks.toArray();


    app.innerHTML = `

        <main class="app-shell">

            <!-- HEADER -->

            <header class="topbar">

                <div class="brand">

                    <div class="brand-icon">
                        ✦
                    </div>

                    <div>

                        <span class="brand-kicker">
                            ORGANIZADOR
                        </span>

                        <h1>
                            Mi Calendario
                        </h1>

                    </div>

                </div>

                <button
                    id="today-button"
                    class="today-button"
                    type="button"
                >
                    Hoy
                </button>

            </header>


            <!-- CALENDARIO -->

            <section class="calendar-container">

                <div class="calendar-toolbar">

                    <button
                        id="previous-month"
                        class="nav-button"
                        type="button"
                        aria-label="Mes anterior"
                    >
                        ‹
                    </button>


                    <div class="month-heading">

                        <span>
                            ${monthNames[month]}
                        </span>

                        <strong>
                            ${year}
                        </strong>

                    </div>


                    <button
                        id="next-month"
                        class="nav-button"
                        type="button"
                        aria-label="Mes siguiente"
                    >
                        ›
                    </button>

                </div>


                <section class="calendar">

                    <div class="weekdays">

                        ${dayNames
                            .map(
                                day => `
                                    <div class="weekday">
                                        ${day}
                                    </div>
                                `
                            )
                            .join("")}

                    </div>


                    <div class="days">

                        ${createDays(
                            startDay,
                            totalDays,
                            year,
                            month,
                            tasks
                        )}

                    </div>

                </section>

            </section>

        </main>


        <!-- ==================================================
             PANEL DEL DÍA
        =================================================== -->

        <div
            id="day-panel-overlay"
            class="panel-overlay hidden"
        >

            <aside
                id="day-panel"
                class="day-panel"
            ></aside>

        </div>


        <!-- ==================================================
             MODAL CREAR TAREA
        =================================================== -->

        <div
            id="task-modal-overlay"
            class="modal-overlay hidden"
        >

            <div class="modal-card">

                <button
                    id="close-task-modal"
                    class="close-button"
                    type="button"
                    aria-label="Cerrar"
                >
                    ×
                </button>


                <div class="modal-heading">

                    <span class="eyebrow">
                        NUEVA TAREA
                    </span>

                    <h2>
                        Crear tarea
                    </h2>

                    <p>
                        Añade algo que quieras recordar
                        para una fecha específica.
                    </p>

                </div>


                <form id="task-form">

                    <div class="form-field">

                        <label for="task-title">
                            Título
                        </label>

                        <input
                            id="task-title"
                            type="text"
                            placeholder="Ej. Estudiar cálculo"
                            required
                        />

                    </div>


                    <div class="form-field">

                        <label for="task-description">
                            Descripción
                        </label>

                        <textarea
                            id="task-description"
                            placeholder="Escribe algunos detalles..."
                        ></textarea>

                    </div>


                    <div class="form-grid">

                        <div class="form-field">

                            <label for="task-date">
                                Fecha
                            </label>

                            <input
                                id="task-date"
                                type="date"
                                required
                            />

                        </div>


                        <div class="form-field">

                            <label>
                                Color
                            </label>

                            <div class="color-picker">

                                ${taskColors
                                    .map(
                                        (
                                            color,
                                            index
                                        ) => `
                                            <label
                                                class="color-option"
                                            >

                                                <input
                                                    type="radio"
                                                    name="task-color"
                                                    value="${color}"
                                                    ${
                                                        index === 4
                                                            ? "checked"
                                                            : ""
                                                    }
                                                />

                                                <span
                                                    class="color-circle"
                                                    style="
                                                        --task-color: ${color};
                                                    "
                                                ></span>

                                            </label>
                                        `
                                    )
                                    .join("")}

                            </div>

                        </div>

                    </div>


                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Crear tarea
                    </button>

                </form>

            </div>

        </div>


        <!-- ==================================================
             MODAL DETALLES
        =================================================== -->

        <div
            id="details-modal-overlay"
            class="modal-overlay hidden"
        >

            <div
                class="modal-card details-card"
            >

                <button
                    id="close-details-modal"
                    class="close-button"
                    type="button"
                    aria-label="Cerrar"
                >
                    ×
                </button>

                <div id="task-details"></div>

            </div>

        </div>


        <!-- ==================================================
             MODAL CONFIRMAR ELIMINACIÓN
        =================================================== -->

        <div
            id="delete-modal-overlay"
            class="modal-overlay hidden"
        >

            <div
                class="
                    modal-card
                    delete-confirmation-card
                "
            >

                <div class="delete-icon">
                    !
                </div>


                <span
                    class="
                        eyebrow
                        delete-eyebrow
                    "
                >
                    ELIMINAR TAREA
                </span>


                <h2>
                    ¿Eliminar esta tarea?
                </h2>


                <p id="delete-message">
                    Esta acción no se puede deshacer.
                </p>


                <div class="delete-actions">

                    <button
                        id="cancel-delete"
                        class="secondary-button"
                        type="button"
                    >
                        Cancelar
                    </button>


                    <button
                        id="confirm-delete"
                        class="delete-button"
                        type="button"
                    >
                        Eliminar
                    </button>

                </div>

            </div>

        </div>
    `;

    setupEvents();
}


/* =========================================================
   CREAR DÍAS DEL CALENDARIO
========================================================= */

function createDays(
    startDay: number,
    totalDays: number,
    year: number,
    month: number,
    tasks: Task[]
): string {
    let html = "";

    /*
     * Espacios antes del primer día.
     */

    for (
        let i = 0;
        i < startDay;
        i++
    ) {
        html += `
            <div class="day empty"></div>
        `;
    }


    /*
     * Días del mes.
     */

    for (
        let day = 1;
        day <= totalDays;
        day++
    ) {
        const date =
            formatDate(
                year,
                month,
                day
            );

        const dayTasks =
            tasks.filter(
                task =>
                    task.date === date
            );

        const now =
            new Date();

        const isToday =
            day === now.getDate() &&
            month === now.getMonth() &&
            year === now.getFullYear();


        html += `

            <button
                class="
                    day
                    ${isToday ? "today" : ""}
                    ${
                        dayTasks.length > 0
                            ? "has-tasks"
                            : ""
                    }
                "
                data-date="${date}"
                type="button"
            >

                <span class="day-number">
                    ${day}
                </span>


                ${
                    dayTasks.length > 0
                        ? `

                            <div class="day-tasks">

                                ${dayTasks
                                    .slice(0, 3)
                                    .map(
                                        task => `

                                            <div
                                                class="mini-task"
                                                style="
                                                    --task-color:
                                                    ${task.color};
                                                "
                                            >

                                                <span
                                                    class="
                                                        mini-task-dot
                                                    "
                                                ></span>


                                                <span
                                                    class="
                                                        mini-task-title
                                                    "
                                                >
                                                    ${escapeHtml(
                                                        task.title
                                                    )}
                                                </span>

                                            </div>

                                        `
                                    )
                                    .join("")}


                                ${
                                    dayTasks.length > 3
                                        ? `

                                            <span
                                                class="
                                                    more-tasks
                                                "
                                            >
                                                +${
                                                    dayTasks.length -
                                                    3
                                                } más
                                            </span>

                                        `
                                        : ""
                                }

                            </div>

                        `
                        : `

                            <span
                                class="empty-day-hint"
                            >
                                +
                            </span>

                        `
                }

            </button>

        `;
    }

    return html;
}


/* =========================================================
   EVENTOS PRINCIPALES
========================================================= */

function setupEvents(): void {

    /*
     * Mes anterior
     */

    document
        .querySelector<HTMLButtonElement>(
            "#previous-month"
        )
        ?.addEventListener(
            "click",
            async () => {

                currentDate.setMonth(
                    currentDate.getMonth() - 1
                );

                await renderCalendar();
            }
        );


    /*
     * Mes siguiente
     */

    document
        .querySelector<HTMLButtonElement>(
            "#next-month"
        )
        ?.addEventListener(
            "click",
            async () => {

                currentDate.setMonth(
                    currentDate.getMonth() + 1
                );

                await renderCalendar();
            }
        );


    /*
     * Volver a hoy
     */

    document
        .querySelector<HTMLButtonElement>(
            "#today-button"
        )
        ?.addEventListener(
            "click",
            async () => {

                currentDate =
                    new Date();

                await renderCalendar();
            }
        );


    /*
     * Seleccionar día
     */

    document
        .querySelectorAll<HTMLButtonElement>(
            ".day:not(.empty)"
        )
        .forEach(
            day => {

                day.addEventListener(
                    "click",
                    () => {

                        const date =
                            day.dataset.date;

                        if (!date) {
                            return;
                        }

                        openDayPanel(date);
                    }
                );
            }
        );


    /*
     * Cerrar modal crear tarea
     */

    document
        .querySelector<HTMLButtonElement>(
            "#close-task-modal"
        )
        ?.addEventListener(
            "click",
            closeTaskModal
        );


    /*
     * Cerrar modal detalles
     */

    document
        .querySelector<HTMLButtonElement>(
            "#close-details-modal"
        )
        ?.addEventListener(
            "click",
            closeDetailsModal
        );


    /*
     * Cerrar panel del día
     * haciendo clic fuera.
     */

    document
        .querySelector<HTMLDivElement>(
            "#day-panel-overlay"
        )
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    event.currentTarget
                ) {
                    closeDayPanel();
                }
            }
        );


    /*
     * Cerrar modal crear tarea
     * haciendo clic fuera.
     */

    document
        .querySelector<HTMLDivElement>(
            "#task-modal-overlay"
        )
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    event.currentTarget
                ) {
                    closeTaskModal();
                }
            }
        );


    /*
     * Cerrar modal detalles
     * haciendo clic fuera.
     */

    document
        .querySelector<HTMLDivElement>(
            "#details-modal-overlay"
        )
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    event.currentTarget
                ) {
                    closeDetailsModal();
                }
            }
        );


    /*
     * Cerrar modal eliminación
     * haciendo clic fuera.
     */

    document
        .querySelector<HTMLDivElement>(
            "#delete-modal-overlay"
        )
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    event.currentTarget
                ) {
                    closeDeleteModal();
                }
            }
        );


    /*
     * Cancelar eliminación
     */

    document
        .querySelector<HTMLButtonElement>(
            "#cancel-delete"
        )
        ?.addEventListener(
            "click",
            closeDeleteModal
        );


    /*
     * Confirmar eliminación
     */

    document
        .querySelector<HTMLButtonElement>(
            "#confirm-delete"
        )
        ?.addEventListener(
            "click",
            confirmDeleteTask
        );


    /*
     * Guardar tarea
     */

    document
        .querySelector<HTMLFormElement>(
            "#task-form"
        )
        ?.addEventListener(
            "submit",
            saveTask
        );
}


/* =========================================================
   PANEL DEL DÍA
========================================================= */

async function openDayPanel(
    date: string
): Promise<void> {

    const overlay =
        document.querySelector<HTMLDivElement>(
            "#day-panel-overlay"
        );

    const panel =
        document.querySelector<HTMLElement>(
            "#day-panel"
        );

    if (!overlay || !panel) {
        return;
    }


    const tasks =
        (
            await db.tasks.toArray()
        ).filter(
            task =>
                task.date === date
        );


    panel.innerHTML = `

        <div class="panel-header">

            <div>

                <span class="eyebrow">
                    FECHA SELECCIONADA
                </span>

                <h2>
                    ${getPrettyDate(date)}
                </h2>

            </div>


            <button
                id="close-day-panel"
                class="
                    close-button
                    panel-close
                "
                type="button"
                aria-label="Cerrar"
            >
                ×
            </button>

        </div>


        <div class="panel-content">

            ${
                tasks.length === 0
                    ? `

                        <div class="empty-state">

                            <div
                                class="empty-state-icon"
                            >
                                ✦
                            </div>


                            <h3>
                                No hay tareas
                            </h3>


                            <p>
                                Este día está libre.
                                Puedes agregar una nueva tarea.
                            </p>

                        </div>

                    `
                    : `

                        <div class="task-count">

                            ${tasks.length}

                            ${
                                tasks.length === 1
                                    ? "tarea"
                                    : "tareas"
                            }

                        </div>


                        <div class="task-list">

                            ${tasks
                                .map(
                                    task =>
                                        createPanelTaskHTML(
                                            task
                                        )
                                )
                                .join("")}

                        </div>

                    `
            }

        </div>


        <div class="panel-footer">

            <button
                id="new-task-from-day"
                class="primary-button"
                type="button"
            >
                <span>
                    ＋
                </span>

                Nueva tarea
            </button>

        </div>
    `;


    overlay.classList.remove(
        "hidden"
    );


    /*
     * Cerrar panel.
     */

    document
        .querySelector<HTMLButtonElement>(
            "#close-day-panel"
        )
        ?.addEventListener(
            "click",
            closeDayPanel
        );


    /*
     * Nueva tarea desde el panel.
     */

    document
        .querySelector<HTMLButtonElement>(
            "#new-task-from-day"
        )
        ?.addEventListener(
            "click",
            () => {

                closeDayPanel();

                openTaskModal(date);
            }
        );


    /*
     * Abrir detalles.
     */

    panel
        .querySelectorAll<HTMLDivElement>(
            ".panel-task"
        )
        .forEach(
            taskElement => {

                taskElement.addEventListener(
                    "click",
                    event => {

                        const target =
                            event.target as HTMLElement;


                        if (
                            target.closest(
                                ".task-status-button"
                            )
                        ) {
                            return;
                        }


                        const taskId =
                            Number(
                                taskElement.dataset.taskId
                            );


                        if (!taskId) {
                            return;
                        }


                        openTaskDetails(
                            taskId
                        );
                    }
                );
            }
        );


    /*
     * Cambiar estado.
     */

    panel
        .querySelectorAll<HTMLButtonElement>(
            ".task-status-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async event => {

                        event.stopPropagation();


                        const taskId =
                            Number(
                                button.dataset.taskId
                            );


                        if (!taskId) {
                            return;
                        }


                        await changeTaskStatus(
                            taskId
                        );


                        await openDayPanel(
                            date
                        );
                    }
                );
            }
        );
}


/* =========================================================
   CERRAR PANEL DEL DÍA
========================================================= */

function closeDayPanel(): void {

    document
        .querySelector<HTMLDivElement>(
            "#day-panel-overlay"
        )
        ?.classList.add(
            "hidden"
        );
}


/* =========================================================
   CREAR HTML DE TAREA
========================================================= */

function createPanelTaskHTML(
    task: Task
): string {

    const completed =
        task.status === "done";


    return `

        <div
            class="
                panel-task
                ${
                    completed
                        ? "task-completed"
                        : ""
                }
            "
            data-task-id="${task.id}"
            style="
                --task-color: ${task.color};
            "
        >

            <div
                class="panel-task-accent"
            ></div>


            <div
                class="panel-task-main"
            >

                <div
                    class="panel-task-title"
                >
                    ${escapeHtml(
                        task.title
                    )}
                </div>


                <div
                    class="
                        panel-task-description
                    "
                >

                    ${
                        task.description
                            ? escapeHtml(
                                task.description
                            )
                            : "Sin descripción"
                    }

                </div>

            </div>


            <button
                type="button"
                class="task-status-button"
                data-task-id="${task.id}"
                title="${getStatusLabel(
                    task.status
                )}"
            >
                ${getStatusSymbol(
                    task.status
                )}
            </button>

        </div>

    `;
}


/* =========================================================
   MODAL CREAR TAREA
========================================================= */

function openTaskModal(
    date: string
): void {

    const overlay =
        document.querySelector<HTMLDivElement>(
            "#task-modal-overlay"
        );

    const dateInput =
        document.querySelector<HTMLInputElement>(
            "#task-date"
        );

    if (!overlay || !dateInput) {
        return;
    }


    dateInput.value =
        date;


    overlay.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            document
                .querySelector<HTMLInputElement>(
                    "#task-title"
                )
                ?.focus();

        },
        50
    );
}

function closeTaskModal(): void {

    const overlay =
        document.querySelector<HTMLDivElement>(
            "#task-modal-overlay"
        );

    const form =
        document.querySelector<HTMLFormElement>(
            "#task-form"
        );

    if (!overlay || !form) {
        return;
    }


    overlay.classList.add(
        "hidden"
    );


    form.reset();
}


/* =========================================================
   DETALLES DE TAREA
========================================================= */

async function openTaskDetails(
    taskId: number
): Promise<void> {

    const task =
        await db.tasks.get(
            taskId
        );


    if (!task) {
        return;
    }


    const overlay =
        document.querySelector<HTMLDivElement>(
            "#details-modal-overlay"
        );

    const details =
        document.querySelector<HTMLDivElement>(
            "#task-details"
        );


    if (!overlay || !details) {
        return;
    }


    details.innerHTML = `

        <div
            class="details-accent"
            style="
                --task-color: ${task.color};
            "
        ></div>


        <span class="eyebrow">
            DETALLES DE LA TAREA
        </span>


        <h2
            class="details-title"
        >
            ${escapeHtml(
                task.title
            )}
        </h2>


        <div class="details-info">

            <div class="detail-item">

                <span
                    class="
                        detail-item-label
                    "
                >
                    Fecha
                </span>


                <strong>
                    ${formatDisplayDate(
                        task.date
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <span
                    class="
                        detail-item-label
                    "
                >
                    Estado
                </span>


                <strong>

                    ${getStatusSymbol(
                        task.status
                    )}

                    ${getStatusLabel(
                        task.status
                    )}

                </strong>

            </div>

        </div>


        <div
            class="
                details-description
            "
        >

            <span
                class="
                    detail-item-label
                "
            >
                Descripción
            </span>


            <p>

                ${
                    task.description
                        ? escapeHtml(
                            task.description
                        )
                        : "Esta tarea no tiene descripción."
                }

            </p>

        </div>


        <button
            id="delete-task-button"
            class="delete-button"
            type="button"
        >
            Eliminar tarea
        </button>
    `;


    overlay.classList.remove(
        "hidden"
    );


    document
        .querySelector<HTMLButtonElement>(
            "#delete-task-button"
        )
        ?.addEventListener(
            "click",
            () => {

                openDeleteModal(
                    task.id,
                    task.title
                );

            }
        );
}


/* =========================================================
   CERRAR DETALLES
========================================================= */

function closeDetailsModal(): void {

    document
        .querySelector<HTMLDivElement>(
            "#details-modal-overlay"
        )
        ?.classList.add(
            "hidden"
        );
}


/* =========================================================
   MODAL DE ELIMINACIÓN
========================================================= */

function openDeleteModal(
    taskId: number | undefined,
    taskTitle: string
): void {

    if (!taskId) {
        return;
    }


    const overlay =
        document.querySelector<HTMLDivElement>(
            "#delete-modal-overlay"
        );


    const message =
        document.querySelector<HTMLParagraphElement>(
            "#delete-message"
        );


    if (!overlay || !message) {
        return;
    }


    taskPendingDeletion =
        taskId;


    message.innerHTML = `

        ¿Quieres eliminar

        <strong>
            "${escapeHtml(
                taskTitle
            )}"
        </strong>?

        <br>

        <span>
            Esta acción no se puede deshacer.
        </span>

    `;


    overlay.classList.remove(
        "hidden"
    );
}


/* =========================================================
   CERRAR MODAL ELIMINACIÓN
========================================================= */

function closeDeleteModal(): void {

    const overlay =
        document.querySelector<HTMLDivElement>(
            "#delete-modal-overlay"
        );


    if (!overlay) {
        return;
    }


    overlay.classList.add(
        "hidden"
    );


    taskPendingDeletion =
        undefined;
}


/* =========================================================
   CONFIRMAR ELIMINACIÓN
========================================================= */

async function confirmDeleteTask(): Promise<void> {

    if (!taskPendingDeletion) {
        return;
    }


    await db.tasks.delete(
        taskPendingDeletion
    );


    closeDeleteModal();

    closeDetailsModal();


    await renderCalendar();
}


/* =========================================================
   CAMBIAR ESTADO
========================================================= */

async function changeTaskStatus(
    taskId: number
): Promise<void> {

    const task =
        await db.tasks.get(
            taskId
        );


    if (!task) {
        return;
    }


    const newStatus =
        getNextStatus(
            task.status
        );


    await db.tasks.update(
        taskId,
        {
            status: newStatus
        }
    );
}


/* =========================================================
   GUARDAR TAREA
========================================================= */

async function saveTask(
    event: SubmitEvent
): Promise<void> {

    event.preventDefault();


    const titleInput =
        document.querySelector<HTMLInputElement>(
            "#task-title"
        );


    const descriptionInput =
        document.querySelector<HTMLTextAreaElement>(
            "#task-description"
        );


    const dateInput =
        document.querySelector<HTMLInputElement>(
            "#task-date"
        );


    const colorInput =
        document.querySelector<HTMLInputElement>(
            'input[name="task-color"]:checked'
        );


    if (
        !titleInput ||
        !descriptionInput ||
        !dateInput ||
        !colorInput
    ) {
        return;
    }


    const title =
        titleInput.value.trim();


    const description =
        descriptionInput.value.trim();


    const date =
        dateInput.value;


    const color =
        colorInput.value;


    if (
        !title ||
        !date
    ) {
        return;
    }


    const task: Task = {

        title,

        description,

        date,

        color,

        status:
            "pending",

        reminder:
            false,

        createdAt:
            new Date().toISOString()
    };


    await db.tasks.add(
        task
    );


    closeTaskModal();


    await renderCalendar();
}


/* =========================================================
   INICIAR APLICACIÓN
========================================================= */

renderCalendar();