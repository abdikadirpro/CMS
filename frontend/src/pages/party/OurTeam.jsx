import { useState } from "react";
import { Card } from "../../components/ui/Card";
import AboutSubnav from "../../components/AboutSubnav";

const TEAM = [
  { name: "Abiy Ahmed Ali", title: "President", photo: "/team/abiy-ahmed-ali.jpg" },
  { name: "Adan Farah", title: "Deputy President", photo: "/team/adan-farah.jpg" },
  { name: "Temesgen", title: "Deputy President", photo: "/team/temesgen.jpg" },
  { name: "Mustafe Muhumed Omer", title: "Central Committee Member", photo: "/team/mustafe-muhumed-omer.jpg" },
  { name: "Mohamed Shale", title: "Head of the Central Office", photo: "/team/mohamed-shale.jpg" },
  { name: "Abdirahman Hurre", title: "Head of Policy Affairs" },
  { name: "Faisal Rashid", title: "Head of Affairs" },
];

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function Avatar({ name, photo }) {
  const [failed, setFailed] = useState(false);

  if (photo && !failed) {
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setFailed(true)}
        className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
      {initials(name)}
    </div>
  );
}

export default function OurTeam() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold">Our Team</h1>
        <p className="mt-3 text-[rgb(var(--fg-muted))]">
          The leadership of Xisbiga Barwaaqo Laantiisa DDS, from the party president down to the head office.
        </p>
      </div>

      <div className="mt-8">
        <AboutSubnav />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TEAM.map((m) => (
          <Card
            key={m.name}
            className="group flex cursor-default items-center gap-4 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
          >
            <Avatar name={m.name} photo={m.photo} />
            <div>
              <h3 className="font-semibold">{m.name}</h3>
              <p className="text-sm text-primary">{m.title}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
