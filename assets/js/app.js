const grid = document.querySelector("#member-grid");

const search = document.querySelector("#member-search");

const count = document.querySelector("#member-count");

const year = document.querySelector("#year");

if (year) {
    year.textContent = new Date().getFullYear();
}

let members = [];

function escapeHtml(value = "") {

    return String(value).replace(/[&<>"']/g, char => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"

    })[char]);

}

function renderMembers(query = "") {

    if (!grid) return;

    const term = query.trim().toLowerCase();

    const visible = members.filter(member => {

        const content = [

            member.name,
            member.role,
            member.bio,
            ...(member.skills || [])

        ].join(" ").toLowerCase();

        return content.includes(term);

    });

    if (count) {

        count.textContent =
            String(members.length).padStart(2, "0")
            + " MEMBERS";

    }

    if (!visible.length) {

        grid.innerHTML = `
            <div class="empty-state">
                No matching builders found.
            </div>
        `;

        return;

    }

    grid.innerHTML = visible.map(member => {

        const initials = member.name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0])
            .join("")
            .toUpperCase();

        const skills = (member.skills || [])
            .slice(0, 3)
            .map(skill =>
                `<span>${escapeHtml(skill)}</span>`
            )
            .join("");

        return `

        <a class="member-card"
        href="/member/${encodeURIComponent(member.slug)}/">

            <div class="member-top">

                <span class="member-initial">
                    ${escapeHtml(initials)}
                </span>

                <span class="member-role">
                    ${escapeHtml(member.role || "CLUB MEMBER")}
                </span>

            </div>

            <h3>
                ${escapeHtml(member.name)}
                <span>↗</span>
            </h3>

            <p>
                ${escapeHtml(member.bio || "")}
            </p>

            <div class="member-skills">
                ${skills}
            </div>

        </a>

        `;

    }).join("");

}

if (grid) {

    fetch("/data/members.json")

        .then(response => {

            if (!response.ok) {
                throw new Error("Directory unavailable");
            }

            return response.json();

        })

        .then(data => {

            members = (data.members || []).filter(member =>

                member.public === true &&
                member.consent === true

            );

            renderMembers();

        })

        .catch(() => {

            grid.innerHTML = `

                <div class="empty-state">
                    The directory is temporarily unavailable.
                </div>

            `;

        });

}

if (search) {

    search.addEventListener("input", () => {

        renderMembers(search.value);

    });

}
