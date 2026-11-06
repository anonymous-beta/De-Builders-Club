import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const dist = path.join(root, "dist");

const siteUrl = (
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    process.env.SITE_URL ||
    "http://localhost:8888"
).replace(/\/$/, "");

function read(file) {

    return fs.readFileSync(
        path.join(root, file),
        "utf8"
    );

}

function write(file, content) {

    const target = path.join(dist, file);

    fs.mkdirSync(
        path.dirname(target),
        { recursive: true }
    );

    fs.writeFileSync(target, content);

}

function copy(from) {

    fs.cpSync(
        path.join(root, from),
        path.join(dist, from),
        { recursive: true }
    );

}

function escapeHtml(value = "") {

    return String(value).replace(/[&<>"']/g, char => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"

    })[char]);

}

const slugPattern =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

fs.rmSync(dist, {
    recursive: true,
    force: true
});

fs.mkdirSync(dist, {
    recursive: true
});

const directory = JSON.parse(
    read("data/members.json")
);

if (!Array.isArray(directory.members)) {

    throw new Error(
        "members.json must contain a members array"
    );

}

const members = directory.members.filter(member =>

    member.public === true &&
    member.consent === true

);

const seen = new Set();

for (const member of members) {

    if (
        !member.name ||
        !member.slug ||
        !slugPattern.test(member.slug)
    ) {

        throw new Error(
            "Every public member needs a name and valid slug"
        );

    }

    if (seen.has(member.slug)) {

        throw new Error(
            "Duplicate member slug: " + member.slug
        );

    }

    seen.add(member.slug);

    if (
        member.email ||
        member.phone ||
        member.homeAddress
    ) {

        throw new Error(
            "Private contact details are not permitted"
        );

    }

}

write(
    "index.html",
    read("index.html").replaceAll(
        "__SITE_URL__",
        siteUrl
    )
);

copy("assets");

copy("data/members.json");


/* MEMBER PROFILE GENERATOR */

function generateProfile(member) {

    const name = escapeHtml(member.name);

    const role = escapeHtml(
        member.role || "Club Member"
    );

    const bio = escapeHtml(
        member.bio || "A builder in De Builder's Club."
    );

    const url =
        siteUrl + "/member/" + member.slug + "/";

    const skills = (member.skills || [])
        .map(skill =>
            `<span>${escapeHtml(skill)}</span>`
        )
        .join("");

    const projects = (member.projects || [])
        .filter(project =>
            project.title &&
            /^https:\/\//i.test(project.url || "")
        )
        .map(project => `

            <a href="${escapeHtml(project.url)}"
            target="_blank"
            rel="noopener noreferrer">

                ${escapeHtml(project.title)} ↗

            </a>

        `).join("");

    const links = [];

    if (
        member.github &&
        /^https:\/\/github\.com\/[A-Za-z0-9-]+\/?$/i
            .test(member.github)
    ) {

        links.push(`

            <a href="${escapeHtml(member.github)}"
            target="_blank"
            rel="noopener noreferrer">

                GITHUB ↗

            </a>

        `);

    }

    if (
        member.website &&
        /^https:\/\//i.test(member.website)
    ) {

        links.push(`

            <a href="${escapeHtml(member.website)}"
            target="_blank"
            rel="noopener noreferrer">

                WEBSITE ↗

            </a>

        `);

    }

    const person = {

        "@context": "https://schema.org",

        "@type": "Person",

        "name": member.name,

        "description": member.bio || "",

        "url": url,

        "memberOf": {

            "@type": "Organization",

            "name": "De Builder's Club",

            "url": siteUrl + "/"

        }

    };

    if (member.jobTitle) {

        person.jobTitle = member.jobTitle;

    }

    if (Array.isArray(member.sameAs)) {

        person.sameAs = member.sameAs.filter(item =>
            /^https:\/\//i.test(item)
        );

    }

    return `

<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<meta name="theme-color" content="#090909">

<title>
${name} — De Builder's Club
</title>

<meta name="description"
content="${escapeHtml(
    (member.seoDescription || member.bio || name)
    .slice(0, 155)
)}">

<meta name="robots"
content="index,follow,max-image-preview:large">

<link rel="canonical" href="${url}">

<link rel="stylesheet"
href="/assets/css/style.css">

<link rel="icon"
href="/assets/images/godfather-emblem.png">

<meta property="og:type" content="profile">

<meta property="og:site_name"
content="De Builder's Club">

<meta property="og:title"
content="${name} — De Builder's Club">

<meta property="og:description"
content="${bio}">

<meta property="og:url" content="${url}">

<script type="application/ld+json">
${JSON.stringify(person).replace(/</g, "\\u003c")}
</script>

</head>

<body>

<div class="grain"></div>

<header class="topbar wrap">

<a class="brand" href="/">

<img
src="/assets/images/godfather-emblem.png"
class="brand-mark"
alt="">

<span>

<b>DE BUILDER'S CLUB</b>

<small>THE FELLOWSHIP OF MAKERS</small>

</span>

</a>

<a class="nav-cta" href="/members/">
THE ROSTER ↗
</a>

</header>


<main class="wrap">

<section class="profile-hero">

<a class="back-link" href="/members/">
← BACK TO THE ROSTER
</a>

<p class="eyebrow">
A MEMBER OF DE BUILDER'S CLUB
</p>

<h1>${name}</h1>

<div class="profile-role">
${role}
</div>

<p class="profile-bio">
${bio}
</p>

</section>


<section class="profile-details">

<div>

<div class="detail-label">
CRAFT / SKILLS
</div>

<div class="member-skills">
${skills}
</div>

</div>

<div>

<div class="detail-label">
SELECTED WORK
</div>

<div class="profile-links">
${projects}
</div>

<div class="profile-links">
${links.join("")}
</div>

</div>

</section>


<p class="profile-notice">

This public profile is published with
the member's permission.

De Builder's Club celebrates the people
behind the work.

</p>

</main>


<footer class="footer wrap">

<span>
DE BUILDER'S CLUB
</span>

<a href="/">
HOME ↗
</a>

</footer>

</body>

</html>

`;

}


/* GENERATE MEMBER PAGES */

for (const member of members) {

    write(
        "member/" + member.slug + "/index.html",
        generateProfile(member)
    );

}


/* GENERATE MEMBERS DIRECTORY */

const cards = members.map(member => {

    const name = escapeHtml(member.name);

    return `

    <a class="member-card"
    href="/member/${member.slug}/">

        <h3>${name} ↗</h3>

        <p>${escapeHtml(member.role || "")}</p>

        <p>${escapeHtml(member.bio || "")}</p>

    </a>

    `;

}).join("");


const membersPage = `

<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>
Members — De Builder's Club
</title>

<meta name="description"
content="Discover the public members of De Builder's Club, a community of builders, developers, makers and independent minds.">

<link rel="canonical"
href="${siteUrl}/members/">

<link rel="stylesheet"
href="/assets/css/style.css">

</head>

<body>

<header class="topbar wrap">

<a class="brand" href="/">
<b>DE BUILDER'S CLUB</b>
</a>

<a href="/">HOME ↗</a>

</header>

<main class="wrap section">

<p class="eyebrow">
THE PUBLIC ROSTER
</p>

<h1>
THE MEMBERS.
</h1>

<div class="member-grid">

${cards || `
<div class="empty-state">
The public roster is being assembled.
</div>
`}

</div>

</main>

</body>

</html>

`;

write(
    "members/index.html",
    membersPage
);


/* XML SITEMAP */

const urls = [

    siteUrl + "/",

    siteUrl + "/members/",

    ...members.map(member =>
        siteUrl + "/member/" + member.slug + "/"
    )

];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urls.map(url => `
<url>
<loc>${escapeHtml(url)}</loc>
</url>
`).join("")}

</urlset>

`;

write("sitemap.xml", sitemap);


/* ROBOTS */

write(
    "robots.txt",

    `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`
);


console.log(
    "De Builder's Club built successfully."
);

console.log(
    members.length + " public member profiles generated."
);
