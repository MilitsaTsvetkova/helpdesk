type Props = {
  subject: string;
  body: string;
};

export function TicketDetails({ subject, body }: Props) {
  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-800">{subject}</h1>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Message</p>
        <div className="border border-slate-200 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {body}
        </div>
      </div>
    </>
  );
}
