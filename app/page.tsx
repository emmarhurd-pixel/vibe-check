import Form from "next/form";

const eventTypes = [
  "Concert",
  "Musical / Theater",
  "Wedding",
  "Party",
  "Festival",
  "Formal / Gala",
  "Date night",
  "Other",
];

const inputStyle = "rounded-lg border border-gray-400 bg-transparent p-3";

export default function Home() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-3xl font-bold">What are you dressing for?</h1>
      <p className="mt-2 text-gray-500">
        Tell us about your event and we'll build the vibe.
      </p>

      <Form action="/results" className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1">
          <span className="font-medium">Type of event</span>
          <select name="type" required className={inputStyle}>
            <option value="">Choose one</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-medium">Event name</span>
          <input
            name="name"
            required
            placeholder="e.g. Stray Kids concert, Hadestown"
            className={inputStyle}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-medium">Date</span>
          <input name="date" type="date" required className={inputStyle} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-medium">City</span>
          <input
            name="city"
            required
            placeholder="e.g. Baltimore, MD"
            className={inputStyle}
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className="font-medium">Venue</span>
          <div className="flex gap-3">
            <label className={`${inputStyle} flex flex-1 items-center gap-2`}>
              <input type="radio" name="venue" value="indoor" defaultChecked />
              Indoor
            </label>
            <label className={`${inputStyle} flex flex-1 items-center gap-2`}>
              <input type="radio" name="venue" value="outdoor" />
              Outdoor
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 rounded-lg bg-foreground p-3 font-semibold text-background"
        >
          Build my look
        </button>
      </Form>
    </main>
  );
}