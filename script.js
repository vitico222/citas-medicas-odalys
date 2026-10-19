/**
 * ==========================================================================
 * SISTEMA DE GESTIÓN MÉDICA & AGENDA PROFESIONAL - DRA. ODALYS MARTÍNEZ
 * ==========================================================================
 * Conexión completa con Firebase Firestore & Authentication
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================================
  // 1. ESTADO DE LA APLICACIÓN
  // ==========================================================================
  const APP_STATE = {
    currentUser: null,
    privacyMode: false,
    patients: [],
    events: [],
  };

  // ==========================================================================
  // 2. REFERENCIAS A ELEMENTOS DEL DOM
  // ==========================================================================
  const DOM = {
    // Autenticación
    loginSection: document.getElementById("login-section"),
    dashboardSection: document.getElementById("dashboard-section"),
    loginForm: document.getElementById("login-form"),
    loginEmail: document.getElementById("login-email"),
    loginPassword: document.getElementById("login-password"),
    loginError: document.getElementById("login-error"),
    btnLogout: document.getElementById("btn-logout"),
    currentDateBadge: document.getElementById("current-date-badge"),

    // Briefing & Privacidad
    todaySummaryList: document.getElementById("today-summary-list"),
    tomorrowSummaryList: document.getElementById("tomorrow-summary-list"),
    btnTogglePrivacy: document.getElementById("btn-toggle-privacy"),

    // Métricas (KPIs)
    kpiTodayPatients: document.getElementById("kpi-today-patients"),
    kpiEventsMonth: document.getElementById("kpi-events-month"),
    kpiPendingReschedule: document.getElementById("kpi-pending-reschedule"),
    kpiAttendedMonth: document.getElementById("kpi-attended-month"),

    // Pestañas
    tabBtns: document.querySelectorAll(".tab-btn"),
    tabContents: document.querySelectorAll(".tab-content"),

    // Formulario de Paciente
    patientForm: document.getElementById("patient-form"),
    patientId: document.getElementById("patient-id"),
    patientName: document.getElementById("patient-name"),
    patientPhone: document.getElementById("patient-phone"),
    patientDatetime: document.getElementById("patient-datetime"),
    patientLocation: document.getElementById("patient-location"),
    patientStatus: document.getElementById("patient-status"),
    patientPayment: document.getElementById("patient-payment"),
    patientMotive: document.getElementById("patient-motive"),
    btnSavePatient: document.getElementById("btn-save-patient"),
    btnCancelPatient: document.getElementById("btn-cancel-patient"),

    // Lista y Filtros de Pacientes
    searchPatient: document.getElementById("search-patient"),
    filterStatus: document.getElementById("filter-status"),
    patientsTableBody: document.getElementById("patients-table-body"),

    // Formulario de Eventos / Conferencias
    eventForm: document.getElementById("event-form"),
    eventId: document.getElementById("event-id"),
    eventTitle: document.getElementById("event-title"),
    eventCategory: document.getElementById("event-category"),
    eventDatetime: document.getElementById("event-datetime"),
    eventLocation: document.getElementById("event-location"),
    eventRequirements: document.getElementById("event-requirements"),
    eventsList: document.getElementById("events-list"),

    // Modal de Historia Clínica
    modalClinical: document.getElementById("modal-clinical"),
    clinicalForm: document.getElementById("clinical-form"),
    modalPatientName: document.getElementById("modal-patient-name"),
    modalPatientId: document.getElementById("modal-patient-id"),
    clinicalHistory: document.getElementById("clinical-history"),
    clinicalDiagnosis: document.getElementById("clinical-diagnosis"),
    clinicalTreatment: document.getElementById("clinical-treatment"),
    btnCloseModal: document.getElementById("btn-close-modal"),
    btnModalCancel: document.getElementById("btn-modal-cancel"),

    // Contenedores KPI para clics
    cardKpiToday:
      document.getElementById("kpi-today-patients")?.parentElement
        ?.parentElement,
    cardKpiEvents:
      document.getElementById("kpi-events-month")?.parentElement?.parentElement,
    cardKpiReschedule: document.getElementById("kpi-pending-reschedule")
      ?.parentElement?.parentElement,
    cardKpiAttended:
      document.getElementById("kpi-attended-month")?.parentElement
        ?.parentElement,

    // Respaldos
    btnExportBackup: document.getElementById("btn-export-backup"),
  };

  // ==========================================================================
  // 3. INICIALIZACIÓN
  // ==========================================================================
  function initApp() {
    displayCurrentDate();
    setupEventListeners();
    checkAuthSession();
  }

  function displayCurrentDate() {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const today = new Date().toLocaleDateString("es-ES", options);
    DOM.currentDateBadge.innerHTML = `<i class="fa-regular fa-calendar-check"></i> ${today.charAt(0).toUpperCase() + today.slice(1)}`;
  }

  // ==========================================================================
  // 4. AUTENTICACIÓN Y LISTENERS
  // ==========================================================================
  function setupEventListeners() {
    DOM.loginForm.addEventListener("submit", handleLogin);
    DOM.btnLogout.addEventListener("click", handleLogout);

    DOM.tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    DOM.patientForm.addEventListener("submit", handleSavePatient);
    DOM.btnCancelPatient.addEventListener("click", resetPatientForm);
    DOM.eventForm.addEventListener("submit", handleSaveEvent);
    DOM.clinicalForm.addEventListener("submit", handleSaveClinicalHistory);

    DOM.searchPatient.addEventListener("input", renderPatientsTable);
    DOM.filterStatus.addEventListener("change", renderPatientsTable);

    DOM.btnTogglePrivacy.addEventListener("click", togglePrivacyMode);

    DOM.btnCloseModal.addEventListener("click", closeModal);
    DOM.btnModalCancel.addEventListener("click", closeModal);

    DOM.btnExportBackup.addEventListener("click", exportBackupJSON);

    // Clics interactivos en los KPIs
    if (DOM.cardKpiToday) {
      DOM.cardKpiToday.addEventListener("click", () => {
        switchTab("tab-pacientes");
        DOM.filterStatus.value = "todos";
        DOM.searchPatient.value = "";
        renderPatientsTable();
      });
    }

    if (DOM.cardKpiEvents) {
      DOM.cardKpiEvents.addEventListener("click", () => {
        switchTab("tab-agenda");
      });
    }

    if (DOM.cardKpiReschedule) {
      DOM.cardKpiReschedule.addEventListener("click", () => {
        switchTab("tab-pacientes");
        DOM.filterStatus.value = "Reagendar";
        DOM.searchPatient.value = "";
        renderPatientsTable();
      });
    }

    if (DOM.cardKpiAttended) {
      DOM.cardKpiAttended.addEventListener("click", () => {
        switchTab("tab-pacientes");
        DOM.filterStatus.value = "Atendido";
        DOM.searchPatient.value = "";
        renderPatientsTable();
      });
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    const email = DOM.loginEmail.value.trim();
    const password = DOM.loginPassword.value.trim();

    if (window.FirebaseDB && window.FirebaseDB.login) {
      window.FirebaseDB.login(email, password)
        .then(() => {
          showDashboard();
        })
        .catch((error) => {
          showLoginError("Error de acceso: Credenciales inválidas.");
        });
    } else {
      // Fallback si no hay conexión con Firebase
      if (email && password.length >= 6) {
        APP_STATE.currentUser = { email };
        showDashboard();
      } else {
        showLoginError("Ingrese un correo y contraseña válidos.");
      }
    }
  }

  function checkAuthSession() {
    if (window.FirebaseDB && window.FirebaseDB.onAuth) {
      window.FirebaseDB.onAuth((user) => {
        if (user) {
          APP_STATE.currentUser = user;
          showDashboard();
        } else {
          showLogin();
        }
      });
    } else {
      showLogin();
    }
  }

  function handleLogout() {
    if (window.FirebaseDB && window.FirebaseDB.logout) {
      window.FirebaseDB.logout().then(() => showLogin());
    } else {
      APP_STATE.currentUser = null;
      showLogin();
    }
  }

  function showLogin() {
    DOM.loginSection.classList.remove("hidden");
    DOM.dashboardSection.classList.add("hidden");
    DOM.btnLogout.classList.add("hidden");
  }

  function showDashboard() {
    DOM.loginSection.classList.add("hidden");
    DOM.dashboardSection.classList.remove("hidden");
    DOM.btnLogout.classList.remove("hidden");

    // ¡AQUÍ SE INICIA LA ESCUCHA DE FIREBASE EN TIEMPO REAL!
    subscribeToFirestoreData();
  }

  function showLoginError(msg) {
    DOM.loginError.textContent = msg;
    DOM.loginError.classList.remove("hidden");
    setTimeout(() => DOM.loginError.classList.add("hidden"), 4000);
  }

  function switchTab(tabId) {
    DOM.tabBtns.forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.tab === tabId),
    );
    DOM.tabContents.forEach((content) =>
      content.classList.toggle("hidden", content.id !== tabId),
    );
  }

  function togglePrivacyMode() {
    APP_STATE.privacyMode = !APP_STATE.privacyMode;
    document.body.classList.toggle("privacy-mode", APP_STATE.privacyMode);
    DOM.btnTogglePrivacy.classList.toggle("btn-primary", APP_STATE.privacyMode);
  }

  // ==========================================================================
  // 5. SINCRONIZACIÓN FIREBASE EN TIEMPO REAL
  // ==========================================================================
  function subscribeToFirestoreData() {
    if (window.FirebaseDB && window.FirebaseDB.subscribePatients) {
      // Escuchar colección de Pacientes
      window.FirebaseDB.subscribePatients((snapshot) => {
        APP_STATE.patients = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        renderDashboard();
      });

      // Escuchar colección de Eventos
      window.FirebaseDB.subscribeEvents((snapshot) => {
        APP_STATE.events = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        renderDashboard();
      });
    } else {
      // Carga local si no hay Firebase configurado
      APP_STATE.patients =
        JSON.parse(localStorage.getItem("om_patients")) ||
        getInitialMockPatients();
      APP_STATE.events =
        JSON.parse(localStorage.getItem("om_events")) || getInitialMockEvents();
      renderDashboard();
    }
  }

  // ==========================================================================
  // 6. DASHBOARD & BRIEFING DIARIO (5:30 AM)
  // ==========================================================================
  function renderDashboard() {
    renderBriefing();
    renderKPIs();
    renderPatientsTable();
    renderEventsList();
  }

  function renderBriefing() {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // 1. Agenda para Hoy
    const todayPatients = APP_STATE.patients.filter(
      (p) => p.datetime && p.datetime.startsWith(todayStr),
    );
    const todayEvents = APP_STATE.events.filter(
      (e) => e.datetime && e.datetime.startsWith(todayStr),
    );

    if (todayPatients.length === 0 && todayEvents.length === 0) {
      DOM.todaySummaryList.innerHTML = `<p class="empty-msg">No hay actividades agendadas para el día de hoy.</p>`;
    } else {
      let html = "";
      todayPatients.forEach((p) => {
        const time = p.datetime ? p.datetime.split("T")[1] : "";
        html += `
                    <div class="summary-item">
                        <span>🩺 <strong>${p.name}</strong> (${time})</span>
                        <span class="status-badge status-${(p.status || "pendiente").toLowerCase()}">${p.status}</span>
                    </div>`;
      });
      todayEvents.forEach((e) => {
        const time = e.datetime ? e.datetime.split("T")[1] : "";
        html += `
                    <div class="summary-item">
                        <span>🎤 <strong>${e.title}</strong> (${time})</span>
                        <span class="status-badge status-atendido">${e.category}</span>
                    </div>`;
      });
      DOM.todaySummaryList.innerHTML = html;
    }

    // 2. Citas para Mañana
    const tomorrowPatients = APP_STATE.patients.filter(
      (p) => p.datetime && p.datetime.startsWith(tomorrowStr),
    );

    if (tomorrowPatients.length === 0) {
      DOM.tomorrowSummaryList.innerHTML = `<p class="empty-msg">No hay citas médicas agendadas para mañana.</p>`;
    } else {
      let html = "";
      tomorrowPatients.forEach((p) => {
        const time = p.datetime ? p.datetime.split("T")[1] : "";
        const waUrl = generateWhatsAppLink(p);
        html += `
                    <div class="summary-item">
                        <div>
                            <strong>${p.name}</strong> - ${time}<br>
                            <small class="text-muted"><i class="fa-solid fa-location-dot"></i> ${p.location}</small>
                        </div>
                        <a href="${waUrl}" target="_blank" class="btn-whatsapp" title="Enviar recordatorio por WhatsApp">
                            <i class="fa-brands fa-whatsapp"></i> Recordar
                        </a>
                    </div>`;
      });
      DOM.tomorrowSummaryList.innerHTML = html;
    }
  }

  function renderKPIs() {
    const todayStr = new Date().toISOString().split("T")[0];

    const todayCount = APP_STATE.patients.filter(
      (p) => p.datetime && p.datetime.startsWith(todayStr),
    ).length;
    const eventsCount = APP_STATE.events.length;
    const rescheduleCount = APP_STATE.patients.filter(
      (p) => p.status === "Reagendar",
    ).length;
    const attendedCount = APP_STATE.patients.filter(
      (p) => p.status === "Atendido",
    ).length;

    DOM.kpiTodayPatients.textContent = todayCount;
    DOM.kpiEventsMonth.textContent = eventsCount;
    DOM.kpiPendingReschedule.textContent = rescheduleCount;
    DOM.kpiAttendedMonth.textContent = attendedCount;
  }

  // ==========================================================================
  // 7. GESTIÓN DE PACIENTES (FIREBASE CRUD)
  // ==========================================================================
  function handleSavePatient(e) {
    e.preventDefault();

    const id = DOM.patientId.value;
    const patientData = {
      name: DOM.patientName.value.trim(),
      phone: DOM.patientPhone.value.trim(),
      datetime: DOM.patientDatetime.value,
      location: DOM.patientLocation.value.trim(),
      status: DOM.patientStatus.value,
      payment: DOM.patientPayment.value,
      motive: DOM.patientMotive.value.trim(),
      clinicalHistory: getPatientField(id, "clinicalHistory", ""),
      clinicalDiagnosis: getPatientField(id, "clinicalDiagnosis", ""),
      clinicalTreatment: getPatientField(id, "clinicalTreatment", ""),
    };

    if (window.FirebaseDB && window.FirebaseDB.addPatient) {
      if (id) {
        window.FirebaseDB.updatePatient(id, patientData).then(() =>
          resetPatientForm(),
        );
      } else {
        window.FirebaseDB.addPatient(patientData).then(() =>
          resetPatientForm(),
        );
      }
    } else {
      // Local fallback
      if (id) {
        const index = APP_STATE.patients.findIndex((p) => p.id === id);
        if (index >= 0) APP_STATE.patients[index] = { id, ...patientData };
      } else {
        APP_STATE.patients.unshift({
          id: Date.now().toString(),
          ...patientData,
        });
      }
      localStorage.setItem("om_patients", JSON.stringify(APP_STATE.patients));
      resetPatientForm();
      renderDashboard();
    }
  }

  function renderPatientsTable() {
    const search = DOM.searchPatient.value.toLowerCase();
    const filter = DOM.filterStatus.value;

    const filtered = APP_STATE.patients.filter((p) => {
      const matchesSearch =
        (p.name && p.name.toLowerCase().includes(search)) ||
        (p.phone && p.phone.includes(search));
      const matchesFilter = filter === "todos" || p.status === filter;
      return matchesSearch && matchesFilter;
    });

    if (filtered.length === 0) {
      DOM.patientsTableBody.innerHTML = `<tr><td colspan="6" class="empty-msg" style="text-align:center; padding: 1.5rem;">No se encontraron registros de pacientes.</td></tr>`;
      return;
    }

    let html = "";
    filtered.forEach((p) => {
      const formattedDate = formatDateTime(p.datetime);
      const waUrl = generateWhatsAppLink(p);
      const payClass = p.payment === "Pagado" ? "badge-paid" : "badge-unpaid";

      html += `
                <tr>
                    <td><strong>${p.name}</strong><br><small class="text-muted">${p.phone}</small></td>
                    <td>${formattedDate}</td>
                    <td><small>${p.location}</small></td>
                    <td><span class="status-badge status-${(p.status || "pendiente").toLowerCase()}">${p.status}</span></td>
                    <td><span class="${payClass}">${p.payment}</span></td>
                    <td>
                        <div style="display:flex; gap:0.375rem; flex-wrap:wrap;">
                            <a href="${waUrl}" target="_blank" class="btn-whatsapp" title="Enviar recordatorio WhatsApp">
                                <i class="fa-brands fa-whatsapp"></i>
                            </a>
                            <button class="btn btn-secondary btn-sm" onclick="editPatient('${p.id}')" title="Editar cita">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="openClinicalModal('${p.id}')" title="Ver Historia Clínica">
                                <i class="fa-solid fa-notes-medical"></i>
                            </button>
                            <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="deletePatient('${p.id}')" title="Eliminar">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
    });

    DOM.patientsTableBody.innerHTML = html;
  }

  window.editPatient = function (id) {
    const patient = APP_STATE.patients.find((p) => p.id === id);
    if (!patient) return;

    DOM.patientId.value = patient.id;
    DOM.patientName.value = patient.name;
    DOM.patientPhone.value = patient.phone;
    DOM.patientDatetime.value = patient.datetime;
    DOM.patientLocation.value = patient.location;
    DOM.patientStatus.value = patient.status;
    DOM.patientPayment.value = patient.payment;
    DOM.patientMotive.value = patient.motive || "";

    DOM.btnSavePatient.innerHTML = `<i class="fa-solid fa-rotate"></i> Actualizar Paciente`;
    DOM.btnCancelPatient.classList.remove("hidden");
    switchTab("tab-pacientes");
  };

  window.deletePatient = function (id) {
    if (confirm("¿Está segura de que desea eliminar este paciente?")) {
      if (window.FirebaseDB && window.FirebaseDB.deletePatient) {
        window.FirebaseDB.deletePatient(id);
      } else {
        APP_STATE.patients = APP_STATE.patients.filter((p) => p.id !== id);
        localStorage.setItem("om_patients", JSON.stringify(APP_STATE.patients));
        renderDashboard();
      }
    }
  };

  function resetPatientForm() {
    DOM.patientId.value = "";
    DOM.patientForm.reset();
    DOM.btnSavePatient.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar Paciente`;
    DOM.btnCancelPatient.classList.add("hidden");
  }

  function generateWhatsAppLink(patient) {
    const cleanPhone = (patient.phone || "").replace(/[^0-9]/g, "");
    const dateObj = new Date(patient.datetime);
    const dateFormatted = isNaN(dateObj)
      ? patient.datetime
      : dateObj.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
    const timeFormatted = isNaN(dateObj)
      ? ""
      : dateObj.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        });

    const message = `Hola ${patient.name}, le saludamos del equipo médico de la *Dra. Odalys Martínez*. Le recordamos su cita agendada para el día *${dateFormatted}* a las *${timeFormatted}* en: *${patient.location}*. Por favor confirme su asistencia. ¡Feliz día!`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  // ==========================================================================
  // 8. GESTIÓN DE EVENTOS Y CONFERENCIAS
  // ==========================================================================
  function handleSaveEvent(e) {
    e.preventDefault();

    const eventData = {
      title: DOM.eventTitle.value.trim(),
      category: DOM.eventCategory.value,
      datetime: DOM.eventDatetime.value,
      location: DOM.eventLocation.value.trim(),
      requirements: DOM.eventRequirements.value.trim(),
    };

    if (window.FirebaseDB && window.FirebaseDB.addEvent) {
      window.FirebaseDB.addEvent(eventData).then(() => DOM.eventForm.reset());
    } else {
      APP_STATE.events.unshift({ id: Date.now().toString(), ...eventData });
      localStorage.setItem("om_events", JSON.stringify(APP_STATE.events));
      DOM.eventForm.reset();
      renderDashboard();
    }
  }

  function renderEventsList() {
    if (APP_STATE.events.length === 0) {
      DOM.eventsList.innerHTML = `<p class="empty-msg">No hay ponencias o reuniones programadas.</p>`;
      return;
    }

    let html = "";
    APP_STATE.events.forEach((e) => {
      const formattedDate = formatDateTime(e.datetime);
      html += `
                <div class="card-box">
                    <h4>${getCategoryIcon(e.category)} ${e.title}</h4>
                    <p><small><strong>Fecha:</strong> ${formattedDate}</small></p>
                    <p><small><strong>Lugar:</strong> ${e.location}</small></p>
                    ${e.requirements ? `<p><small><strong>Detalles:</strong> ${e.requirements}</small></p>` : ""}
                    <div style="text-align:right; margin-top:0.5rem;">
                        <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="deleteEvent('${e.id}')">
                            <i class="fa-solid fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>`;
    });

    DOM.eventsList.innerHTML = html;
  }

  window.deleteEvent = function (id) {
    if (confirm("¿Eliminar esta conferencia/reunión?")) {
      if (window.FirebaseDB && window.FirebaseDB.deleteEvent) {
        window.FirebaseDB.deleteEvent(id);
      } else {
        APP_STATE.events = APP_STATE.events.filter((e) => e.id !== id);
        localStorage.setItem("om_events", JSON.stringify(APP_STATE.events));
        renderDashboard();
      }
    }
  };

  function getCategoryIcon(cat) {
    switch (cat) {
      case "Conferencia":
        return "🎤";
      case "Reunion":
        return "👥";
      case "Institucional":
        return "🏛️";
      default:
        return "📌";
    }
  }

  // ==========================================================================
  // 9. MODAL DE HISTORIA CLÍNICA (PSIQUIATRÍA)
  // ==========================================================================
  window.openClinicalModal = function (id) {
    const patient = APP_STATE.patients.find((p) => p.id === id);
    if (!patient) return;

    DOM.modalPatientId.value = patient.id;
    DOM.modalPatientName.textContent = patient.name;
    DOM.clinicalHistory.value = patient.clinicalHistory || "";
    DOM.clinicalDiagnosis.value = patient.clinicalDiagnosis || "";
    DOM.clinicalTreatment.value = patient.clinicalTreatment || "";

    DOM.modalClinical.classList.remove("hidden");
  };

  function closeModal() {
    DOM.modalClinical.classList.add("hidden");
  }

  function handleSaveClinicalHistory(e) {
    e.preventDefault();
    const id = DOM.modalPatientId.value;

    const clinicalData = {
      clinicalHistory: DOM.clinicalHistory.value.trim(),
      clinicalDiagnosis: DOM.clinicalDiagnosis.value.trim(),
      clinicalTreatment: DOM.clinicalTreatment.value.trim(),
    };

    if (window.FirebaseDB && window.FirebaseDB.updatePatient) {
      window.FirebaseDB.updatePatient(id, clinicalData).then(() => {
        closeModal();
        alert("Expediente clínico resguardado en la nube.");
      });
    } else {
      const patient = APP_STATE.patients.find((p) => p.id === id);
      if (patient) {
        Object.assign(patient, clinicalData);
        localStorage.setItem("om_patients", JSON.stringify(APP_STATE.patients));
        closeModal();
        alert("Expediente clínico resguardado localmente.");
      }
    }
  }

  // ==========================================================================
  // 10. RESPALDO EN JSON Y AUXILIARES
  // ==========================================================================
  function exportBackupJSON() {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(APP_STATE, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `Respaldo_Dra_Odalys_Martinez_${new Date().toISOString().split("T")[0]}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function getPatientField(id, field, defaultVal) {
    const p = APP_STATE.patients.find((item) => item.id === id);
    return p && p[field] !== undefined ? p[field] : defaultVal;
  }

  function formatDateTime(dtStr) {
    if (!dtStr) return "-";
    const dateObj = new Date(dtStr);
    if (isNaN(dateObj)) return dtStr;
    return dateObj.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getInitialMockPatients() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return [
      {
        id: "1",
        name: "Carlos Mendoza",
        phone: "+584121234567",
        datetime: `${new Date().toISOString().split("T")[0]}T09:00`,
        location: "Hospital Central de Maracay",
        status: "Pendiente",
        payment: "Pagado",
        motive: "Evaluación psiquiátrica de control",
      },
    ];
  }

  function getInitialMockEvents() {
    return [
      {
        id: "101",
        title: "Conferencia: Salud Mental y Bienestar",
        category: "Conferencia",
        datetime: `${new Date().toISOString().split("T")[0]}T14:30`,
        location: "Auditorio HCM - Maracay",
      },
    ];
  }

  // INICIAR LA APLICACIÓN
  initApp();
});
