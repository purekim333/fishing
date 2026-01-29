const countdownEl = document.querySelector("[data-countdown]");

if (countdownEl) {
  const target = new Date(countdownEl.dataset.countdown + "T00:00:00");
  const now = new Date();
  const diffMs = target - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    countdownEl.textContent = `D-${diffDays}`;
  } else if (diffDays === 0) {
    countdownEl.textContent = "D-Day";
  } else {
    countdownEl.textContent = `D+${Math.abs(diffDays)}`;
  }
}
