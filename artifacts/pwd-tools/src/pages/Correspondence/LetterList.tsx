import { Edit2, Eye, FileText, Mail, Plus, Reply, Trash2 } from "lucide-react";
import { useState } from "react";
import LetterTemplates from "./LetterTemplates.tsx";
import type { Letter, View } from "./types";

interface Props {
  letters: Letter[];
  onNavigate: (view: View) => void;
  onDelete: (id: string) => void;
}

const TYPE_LABEL: Record<string, string> = { new: "नया पत्र", reply: "प्रत्युत्तर" };
const STATUS_LABEL: Record<string, string> = { draft: "Draft", final: "Final" };
const LANGUAGE_LABEL: Record<string, string> = { hindi: "हिन्दी", english: "English", both: "हिन्दी + English" };

export default function LetterList({ letters, onNavigate, onDelete }: Props) {
  const [filterType, setFilterType] = useState<"all" | "new" | "reply">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "final">("all");

  const filtered = letters.filter((l) => {
    if (filterType !== "all" && l.type !== filterType) return false;
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: letters.length,
    newLetters: letters.filter((l) => l.type === "new").length,
    replies: letters.filter((l) => l.type === "reply").length,
    drafts: letters.filter((l) => l.status === "draft").length,
    finals: letters.filter((l) => l.status === "final").length,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "कुल पत्र", value: stats.total, color: "bg-blue-50 border-blue-200 text-blue-700" },
          { label: "नये पत्र", value: stats.newLetters, color: "bg-green-50 border-green-200 text-green-700" },
          { label: "प्रत्युत्तर", value: stats.replies, color: "bg-purple-50 border-purple-200 text-purple-700" },
          { label: "Draft", value: stats.drafts, color: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Final", value: stats.finals, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
        ].map((s) => (
          <div key={s.label} className={`border rounded-lg p-3 text-center ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs mt-0.5 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          data-testid="btn-new-letter"
          onClick={() => onNavigate({ name: "new" })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
        >
          <Plus size={16} /> नया पत्र
        </button>
        <button
          data-testid="btn-reply-letter"
          onClick={() => onNavigate({ name: "reply" })}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Reply size={16} /> प्रत्युत्तर पत्र
        </button>
      </div>

      {/* Quick Templates */}
      <LetterTemplates />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-gray-500">प्रकार:</span>
        {(["all", "new", "reply"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setFilterType(v)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterType === v
              ? "bg-blue-700 text-white border-blue-700"
              : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
              }`}
          >
            {v === "all" ? "सभी" : TYPE_LABEL[v]}
          </button>
        ))}
        <span className="ml-3 text-sm font-medium text-gray-500">स्थिति:</span>
        {(["all", "draft", "final"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setFilterStatus(v)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterStatus === v
              ? "bg-gray-800 text-white border-gray-800"
              : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
              }`}
          >
            {v === "all" ? "सभी" : STATUS_LABEL[v]}
          </button>
        ))}
      </div>

      {/* Letter List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Mail size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">कोई पत्र नहीं मिला</p>
          <p className="text-xs mt-1">ऊपर दिए बटन से नया पत्र बनाएं</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((letter) => (
            <div
              key={letter.id}
              data-testid={`letter-row-${letter.id}`}
              className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-start gap-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="mt-1 shrink-0">
                {letter.type === "reply" ? (
                  <Reply size={18} className="text-indigo-500" />
                ) : (
                  <FileText size={18} className="text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono text-gray-500">{letter.letterNumber}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${letter.type === "reply"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-blue-100 text-blue-700"
                      }`}
                  >
                    {TYPE_LABEL[letter.type]}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${letter.status === "final"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                      }`}
                  >
                    {STATUS_LABEL[letter.status]}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">{letter.date}</span>
                </div>
                <p className="text-sm font-medium text-gray-800 truncate">{letter.subject || letter.subjectEn}</p>
                <p className="text-xs text-gray-500 truncate">
                  {letter.language === "english" ? "To:" : "प्रति:"} {letter.toDesignationEn || letter.toDesignation}, {letter.toNameEn || letter.toName}
                </p>
                <p className="text-[11px] text-gray-400">{LANGUAGE_LABEL[letter.language] ?? "हिन्दी"}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  data-testid={`btn-view-${letter.id}`}
                  title="देखें"
                  onClick={() => onNavigate({ name: "detail", id: letter.id })}
                  className="p-1.5 rounded hover:bg-blue-50 text-gray-500 hover:text-blue-700 transition-colors"
                >
                  <Eye size={15} />
                </button>
                <button
                  data-testid={`btn-edit-${letter.id}`}
                  title="संपादित करें"
                  onClick={() => onNavigate({ name: "edit", id: letter.id })}
                  className="p-1.5 rounded hover:bg-amber-50 text-gray-500 hover:text-amber-700 transition-colors"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  data-testid={`btn-delete-${letter.id}`}
                  title="हटाएं"
                  onClick={() => {
                    if (confirm("क्या आप इस पत्र को हटाना चाहते हैं?")) onDelete(letter.id);
                  }}
                  className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
