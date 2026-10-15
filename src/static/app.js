document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, className) {
    messageDiv.textContent = message;
    messageDiv.className = className;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error("Failed to load activities");
      }
      const activities = await response.json();

      // Clear loading message
      activitiesList.replaceChildren();
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "-- Select an activity --";
      activitySelect.replaceChildren(placeholder);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const heading = document.createElement("h4");
        heading.textContent = name;
        const description = document.createElement("p");
        description.textContent = details.description;
        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
        const availability = document.createElement("p");
        availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";
        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (details.participants.length === 0) {
          const emptyItem = document.createElement("li");
          emptyItem.className = "participant-empty";
          emptyItem.textContent = "No participants yet";
          participantsList.appendChild(emptyItem);
        }

        details.participants.forEach((email) => {
          const participant = document.createElement("li");
          participant.className = "participant-item";
          const participantEmail = document.createElement("span");
          participantEmail.textContent = email;

          const removeButton = document.createElement("button");
          removeButton.className = "remove-participant";
          removeButton.type = "button";
          removeButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
          removeButton.title = `Unregister ${email}`;
          removeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" /></svg>';
          removeButton.addEventListener("click", async () => {
            try {
              const unregisterResponse = await fetch(
                `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );
              const result = await unregisterResponse.json();

              if (!unregisterResponse.ok) {
                showMessage(result.detail || "Unable to unregister participant", "error");
                return;
              }

              showMessage(result.message, "success");
              await fetchActivities();
            } catch (error) {
              showMessage("Failed to unregister participant. Please try again.", "error");
              console.error("Error unregistering participant:", error);
            }
          });

          participant.append(participantEmail, removeButton);
          participantsList.appendChild(participant);
        });

        participantsSection.append(participantsHeading, participantsList);
        activityCard.append(heading, description, schedule, availability, participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
