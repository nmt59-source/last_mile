// ── INIT ──
document.addEventListener('DOMContentLoaded', function () {
  loadPassageState();

  // Restore date/county inputs from persisted state
  if (A.dateOfDeath) {
    const e = document.getElementById('date-of-death-inp');
    if (e) e.value = A.dateOfDeath;
    trackerState.dateOfDeath = A.dateOfDeath;
  }
  if (A.deathCounty) {
    const e = document.getElementById('death-county-inp');
    if (e) e.value = A.deathCounty;
  }

  // If a session was saved mid-flow, resume at the dashboard
  if (tasks.length && A.name) {
    go('s-dashboard');
    renderDash();
    refreshFiles('cert');
    refreshFiles('bank');
  }
});
