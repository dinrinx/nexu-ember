"use client";

// components/modules/CastModule.tsx
// Модуль "Герои": список слева + подробная анкета персонажа справа.
// Ядро — поля метода снежинки (цель/мотивация/конфликт/арка), вокруг —
// расширенный профиль по образцу референс-анкеты (общая инфа, семья,
// убеждения, характеристики, личность, бонус-вопросы, предыстория).

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface CharacterFields {
  name: string;
  role: string;
  photoUrl?: string;
  desc: string;
  goal: string;
  motivation: string;
  conflict: string;
  arc: string;
  voice: string;
  notes: string;
  general: Record<string, string>;
  family: Record<string, string>;
  extra: Record<string, string>;
  beliefs: Record<string, number>;
  priorities: Record<string, number>;
  colors: Record<string, string>;
  spectrum: Record<string, number>;
  skills: Record<string, number>;
  bonus: Record<string, string>;
}

interface Character {
  id: string;
  fields: CharacterFields;
  avatarColor: string;
}

const AVATAR_COLORS = [
  "var(--type-book-bg)",
  "var(--type-fanfic-bg)",
  "var(--type-talk-bg)",
  "var(--status-progress-bg)",
  "var(--status-draft-bg)",
  "var(--status-done-bg)",
];

const GENERAL_FIELDS = [
  ["alias", "Прозвище"],
  ["age", "Возраст"],
  ["gender", "Пол"],
  ["sexuality", "Ориентация"],
  ["appearance", "На вид лет"],
  ["birthday", "Дата рождения"],
  ["placeOfBirth", "Место рождения"],
  ["job", "Род занятий"],
  ["bodyType", "Телосложение"],
  ["height", "Рост"],
  ["disabilities", "Особенности здоровья"],
  ["bloodType", "Группа крови"],
  ["hairType", "Тип волос"],
  ["style", "Стиль"],
  ["religion", "Религия"],
  ["allergies", "Аллергии"],
  ["lifeExpectancy", "Продолжительность жизни"],
  ["vices", "Вредные привычки"],
];

const FAMILY_FIELDS = [
  ["father", "Отец"],
  ["mother", "Мать"],
  ["siblings", "Братья/сёстры"],
  ["extendedFamily", "Дальняя родня"],
  ["bestFriend", "Лучший друг"],
  ["pets", "Питомцы"],
];

const EXTRA_FIELDS = [
  ["socialClass", "Социальный класс"],
  ["zodiacSign", "Знак зодиака"],
  ["personalityType", "Тип личности"],
  ["nationality", "Национальность"],
  ["ethnicity", "Этничность"],
  ["languages", "Языки"],
  ["notableFeatures", "Особые приметы"],
];

const COLOR_FIELDS = [
  ["hair", "Волосы"],
  ["eyes", "Глаза"],
  ["skin", "Кожа"],
];

const BONUS_FIELDS = [
  ["quirks", "Причуды и привычки"],
  ["hobbies", "Хобби"],
  ["mantra", "Личная мантра"],
  ["favMemory", "Любимое воспоминание"],
  ["worstMemory", "Худшее воспоминание"],
  ["dreams", "Мечты и цели"],
  ["likes", "Нравится"],
  ["dislikes", "Не нравится"],
];

const BELIEFS = [
  ["highPower", "Высшая сила"],
  ["fateDestiny", "Судьба"],
  ["magic", "Магия"],
  ["soulmates", "Родственные души"],
  ["goodEvil", "Добро и зло"],
  ["luck", "Удача"],
  ["prophecies", "Пророчества"],
  ["karma", "Карма"],
];

const PRIORITIES = [
  ["family", "Семья"],
  ["friends", "Друзья"],
  ["love", "Любовь"],
  ["truth", "Истина"],
  ["fame", "Слава"],
  ["wealth", "Богатство"],
  ["justice", "Справедливость"],
  ["praise", "Похвала"],
];

const SKILLS = [
  ["strength", "Сила"],
  ["dexterity", "Ловкость"],
  ["health", "Здоровье"],
  ["energy", "Энергия"],
  ["beauty", "Красота"],
  ["style", "Стиль"],
  ["hygiene", "Гигиена"],
  ["charisma", "Харизма"],
  ["intelligence", "Интеллект"],
  ["happiness", "Счастье"],
  ["confidence", "Уверенность"],
  ["humor", "Юмор"],
  ["anxiety", "Тревожность"],
  ["patience", "Терпение"],
  ["passion", "Страсть"],
  ["empathy", "Эмпатия"],
  ["wealth", "Достаток"],
  ["creativity", "Креативность"],
  ["calmness", "Спокойствие"],
  ["affection", "Привязанность"],
  ["modesty", "Скромность"],
  ["literacy", "Грамотность"],
  ["techSavvy", "Техническая грамотность"],
  ["cooking", "Кулинария"],
];

const SPECTRUM = [
  ["honest", "Честный", "Лживый"],
  ["leader", "Лидер", "Последователь"],
  ["polite", "Вежливый", "Грубый"],
  ["political", "Политичный", "Прямолинейный"],
  ["nice", "Добрый", "Злой"],
  ["brave", "Храбрый", "Трусливый"],
  ["pacifist", "Миротворец", "Агрессивный"],
  ["extrovert", "Экстраверт", "Интроверт"],
  ["thoughtful", "Вдумчивый", "Импульсивный"],
  ["selfless", "Бескорыстный", "Эгоистичный"],
  ["giving", "Щедрый", "Жадный"],
  ["frugal", "Экономный", "Расточительный"],
  ["optimistic", "Оптимист", "Пессимист"],
  ["productive", "Продуктивный", "Ленивый"],
  ["idealistic", "Идеалист", "Прагматик"],
];

export function emptyCharacterFields(): CharacterFields {
  return {
    name: "",
    role: "",
    photoUrl: "",
    desc: "",
    goal: "",
    motivation: "",
    conflict: "",
    arc: "",
    voice: "",
    notes: "",
    general: {},
    family: {},
    extra: {},
    beliefs: {},
    priorities: {},
    colors: {},
    spectrum: {},
    skills: {},
    bonus: {},
  };
}

export function CastModule({
  workspaceId,
  projectId,
  initial,
}: {
  workspaceId: string;
  projectId: string;
  initial: Character[];
}) {
  const [characters, setCharacters] = useState<Character[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(
    initial[0]?.id ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selected = characters.find((c) => c.id === selectedId) ?? null;

  async function addCharacter() {
    const supabase = createClient();
    const color = AVATAR_COLORS[characters.length % AVATAR_COLORS.length];
    const fields = emptyCharacterFields();
    const { data } = await supabase
      .from("cards")
      .insert({
        project_id: projectId,
        type: "character",
        fields,
        sort_order: characters.length,
      })
      .select("id")
      .single();
    if (data) {
      setCharacters((prev) => [
        ...prev,
        { id: data.id, fields, avatarColor: color },
      ]);
      setSelectedId(data.id);
    }
  }

  async function removeCharacter(id: string) {
    if (!confirm("Удалить героя без возможности отмены?")) return;
    const supabase = createClient();
    await supabase.from("cards").delete().eq("id", id);
    setCharacters((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setSelectedId(next[0]?.id ?? null);
      return next;
    });
  }

  async function saveFields(id: string, fields: CharacterFields) {
    const supabase = createClient();
    await supabase.from("cards").update({ fields }).eq("id", id);
  }

  function patchFlat(id: string, key: keyof CharacterFields, value: string) {
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, fields: { ...c.fields, [key]: value } } : c,
      ),
    );
  }

  function patchGroup(
    id: string,
    group: keyof CharacterFields,
    key: string,
    value: string | number,
  ) {
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              fields: {
                ...c.fields,
                [group]: { ...(c.fields[group] as any), [key]: value },
              },
            }
          : c,
      ),
    );
  }

  function persist(id: string) {
    setCharacters((prev) => {
      const c = prev.find((x) => x.id === id);
      if (c) saveFields(id, c.fields);
      return prev;
    });
  }

  function patchGroupAndPersist(
    id: string,
    group: keyof CharacterFields,
    key: string,
    value: number,
  ) {
    setCharacters((prev) => {
      const next = prev.map((c) =>
        c.id === id
          ? {
              ...c,
              fields: {
                ...c.fields,
                [group]: { ...(c.fields[group] as any), [key]: value },
              },
            }
          : c,
      );
      const updated = next.find((c) => c.id === id);
      if (updated) saveFields(id, updated.fields);
      return next;
    });
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Файл слишком большой (максимум 5 МБ)");
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${workspaceId}/${projectId}/${selected.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("character-photos")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      alert("Не получилось загрузить фото: " + uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage
      .from("character-photos")
      .getPublicUrl(path);
    patchFlat(selected.id, "photoUrl", data.publicUrl);
    persist(selected.id);
    setUploading(false);
  }

  if (characters.length === 0) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px dashed var(--border-strong)",
          borderRadius: "20px",
          padding: "56px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "var(--type-book-bg)",
            margin: "0 auto 20px",
          }}
        />
        <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px" }}>
          Ещё нет героев и аудитории
        </h3>
        <p
          style={{
            fontSize: "14px",
            lineHeight: 1.6,
            color: "var(--ink-dim)",
            margin: "0 auto 22px",
            maxWidth: "380px",
          }}
        >
          Заполните подробную анкету: от цели и конфликта до семьи, убеждений и
          мелких привычек.
        </p>
        <button onClick={addCharacter} style={primaryBtn}>
          + Добавить героя
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "210px 1fr",
        gap: "20px",
        alignItems: "start",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          position: "sticky",
          top: "26px",
        }}
      >
        {characters.map((c) => {
          const active = c.id === selectedId;
          const initials = (c.fields.name || "?").slice(0, 2).toUpperCase();
          return (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              style={{
                ...listRow,
                background: active ? "#F5F2EA" : "#fff",
                border: `1px solid ${active ? "var(--border-strong)" : "var(--border)"}`,
              }}
            >
              {c.fields.photoUrl ? (
                <img src={c.fields.photoUrl} alt="" style={avatarImg} />
              ) : (
                <span
                  style={{ ...avatarPlaceholder, background: c.avatarColor }}
                >
                  {initials}
                </span>
              )}
              <span style={{ minWidth: 0 }}>
                <span style={rowName}>{c.fields.name || "Без имени"}</span>
                <span style={rowRole}>{c.fields.role || "—"}</span>
              </span>
            </button>
          );
        })}
        <button onClick={addCharacter} style={addRow}>
          <span
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "#F0EDE6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            +
          </span>
          Добавить героя
        </button>
      </div>

      {selected && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* шапка: фото + имя/роль */}
          <div
            style={{ ...card, display: "flex", gap: "22px", padding: "24px" }}
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                width: "96px",
                height: "120px",
                flexShrink: 0,
                borderRadius: "16px",
                background: selected.fields.photoUrl
                  ? "transparent"
                  : selected.avatarColor,
                border: "none",
                cursor: "pointer",
                padding: 0,
                overflow: "hidden",
              }}
            >
              {selected.fields.photoUrl ? (
                <img
                  src={selected.fields.photoUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: "12px", color: "var(--ink-dim)" }}>
                  {uploading ? "Загружаю…" : "Фото"}
                </span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "4px",
              }}
            >
              <FieldLabel>Имя</FieldLabel>
              <input
                value={selected.fields.name}
                onChange={(e) => patchFlat(selected.id, "name", e.target.value)}
                onBlur={() => persist(selected.id)}
                placeholder="Имя героя"
                style={{
                  ...editableText,
                  fontSize: "22px",
                  fontWeight: 700,
                  letterSpacing: "-0.3px",
                }}
              />
              <input
                value={selected.fields.role}
                onChange={(e) => patchFlat(selected.id, "role", e.target.value)}
                onBlur={() => persist(selected.id)}
                placeholder="Роль"
                style={{
                  ...editableText,
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  color: "var(--ink-faint)",
                }}
              />
            </div>
          </div>

          {/* метод снежинки — ядро */}
          <Section title="Метод снежинки">
            <FieldLabel>Описание</FieldLabel>
            <textarea
              value={selected.fields.desc}
              onChange={(e) => patchFlat(selected.id, "desc", e.target.value)}
              onBlur={() => persist(selected.id)}
              placeholder="Кто это? Пара предложений о герое."
              rows={2}
              style={{
                ...editableText,
                fontSize: "14px",
                lineHeight: 1.6,
                width: "100%",
                marginBottom: "16px",
              }}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <MiniField
                label="Цель"
                value={selected.fields.goal}
                onChange={(v) => patchFlat(selected.id, "goal", v)}
                onBlur={() => persist(selected.id)}
              />
              <MiniField
                label="Мотивация"
                value={selected.fields.motivation}
                onChange={(v) => patchFlat(selected.id, "motivation", v)}
                onBlur={() => persist(selected.id)}
              />
              <MiniField
                label="Конфликт"
                value={selected.fields.conflict}
                onChange={(v) => patchFlat(selected.id, "conflict", v)}
                onBlur={() => persist(selected.id)}
              />
              <MiniField
                label="Арка"
                value={selected.fields.arc}
                onChange={(v) => patchFlat(selected.id, "arc", v)}
                onBlur={() => persist(selected.id)}
              />
            </div>
          </Section>

          <Section title="Общая информация">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "14px 20px",
              }}
            >
              {GENERAL_FIELDS.map(([key, label]) => (
                <CompactField
                  key={key}
                  label={label}
                  value={selected.fields.general[key] ?? ""}
                  onChange={(v) => patchGroup(selected.id, "general", key, v)}
                  onBlur={() => persist(selected.id)}
                />
              ))}
            </div>
          </Section>

          <Section title="Голос">
            <input
              value={selected.fields.voice}
              onChange={(e) => patchFlat(selected.id, "voice", e.target.value)}
              onBlur={() => persist(selected.id)}
              placeholder="Тембр, манера речи, акцент, характерные фразы"
              style={{ ...editableText, fontSize: "14px", width: "100%" }}
            />
          </Section>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Section title="Семья">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {FAMILY_FIELDS.map(([key, label]) => (
                  <CompactField
                    key={key}
                    label={label}
                    value={selected.fields.family[key] ?? ""}
                    onChange={(v) => patchGroup(selected.id, "family", key, v)}
                    onBlur={() => persist(selected.id)}
                  />
                ))}
              </div>
            </Section>
            <Section title="Доп. информация">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {EXTRA_FIELDS.map(([key, label]) => (
                  <CompactField
                    key={key}
                    label={label}
                    value={selected.fields.extra[key] ?? ""}
                    onChange={(v) => patchGroup(selected.id, "extra", key, v)}
                    onBlur={() => persist(selected.id)}
                  />
                ))}
              </div>
            </Section>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Section title="Убеждения">
              {BELIEFS.map(([key, label]) => (
                <RatingRow
                  key={key}
                  label={label}
                  value={selected.fields.beliefs[key] ?? 0}
                  onChange={(n) =>
                    patchGroupAndPersist(selected.id, "beliefs", key, n)
                  }
                />
              ))}
            </Section>
            <Section title="Приоритеты">
              {PRIORITIES.map(([key, label]) => (
                <RatingRow
                  key={key}
                  label={label}
                  value={selected.fields.priorities[key] ?? 0}
                  onChange={(n) =>
                    patchGroupAndPersist(selected.id, "priorities", key, n)
                  }
                />
              ))}
            </Section>
          </div>

          <Section title="Цветовая схема">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "20px",
              }}
            >
              {COLOR_FIELDS.map(([key, label]) => (
                <CompactField
                  key={key}
                  label={label}
                  value={selected.fields.colors[key] ?? ""}
                  onChange={(v) => patchGroup(selected.id, "colors", key, v)}
                  onBlur={() => persist(selected.id)}
                />
              ))}
            </div>
          </Section>

          <Section title="Личность">
            {SPECTRUM.map(([key, left, right]) => (
              <SpectrumRow
                key={key}
                left={left}
                right={right}
                value={selected.fields.spectrum[key] ?? 2}
                onChange={(n) =>
                  patchGroupAndPersist(selected.id, "spectrum", key, n)
                }
              />
            ))}
          </Section>

          <Section title="Характеристики и навыки">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "4px 24px",
              }}
            >
              {SKILLS.map(([key, label]) => (
                <RatingRow
                  key={key}
                  label={label}
                  value={selected.fields.skills[key] ?? 0}
                  onChange={(n) =>
                    patchGroupAndPersist(selected.id, "skills", key, n)
                  }
                />
              ))}
            </div>
          </Section>

          <Section title="Бонус">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px 20px",
              }}
            >
              {BONUS_FIELDS.map(([key, label]) => (
                <CompactField
                  key={key}
                  label={label}
                  value={selected.fields.bonus[key] ?? ""}
                  onChange={(v) => patchGroup(selected.id, "bonus", key, v)}
                  onBlur={() => persist(selected.id)}
                />
              ))}
            </div>
          </Section>

          <Section title="Заметки и предыстория">
            <textarea
              value={selected.fields.notes}
              onChange={(e) => patchFlat(selected.id, "notes", e.target.value)}
              onBlur={() => persist(selected.id)}
              placeholder="Свободное поле для предыстории и всего остального"
              rows={6}
              style={{
                ...editableText,
                fontSize: "14px",
                lineHeight: 1.65,
                width: "100%",
              }}
            />
          </Section>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => removeCharacter(selected.id)}
              style={dangerBtn}
            >
              Удалить героя
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={card}>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.2px",
          color: "var(--ink-faint)",
          marginBottom: "16px",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "10px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.8px",
        color: "var(--ink-faint)",
        marginBottom: "5px",
      }}
    >
      {children}
    </div>
  );
}

function MiniField({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        rows={2}
        style={{
          ...editableText,
          fontSize: "13.5px",
          lineHeight: 1.5,
          width: "100%",
        }}
      />
    </div>
  );
}

function CompactField({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "10px",
          color: "var(--ink-faint)",
          marginBottom: "3px",
        }}
      >
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        style={{
          ...editableText,
          fontSize: "13.5px",
          width: "100%",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "4px",
        }}
      />
    </div>
  );
}

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "5px 0",
      }}
    >
      <span style={{ fontSize: "12.5px", color: "var(--ink-dim)" }}>
        {label}
      </span>
      <div style={{ display: "flex", gap: "4px" }}>
        {[0, 1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => onChange(value === n + 1 ? 0 : n + 1)}
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              border: "1px solid var(--border-strong)",
              background: n < value ? "var(--accent)" : "transparent",
              padding: 0,
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SpectrumRow({
  left,
  right,
  value,
  onChange,
}: {
  left: string;
  right: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "110px 1fr 110px",
        alignItems: "center",
        gap: "10px",
        padding: "6px 0",
      }}
    >
      <span style={{ fontSize: "12px", color: "var(--ink-dim)" }}>{left}</span>
      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
        {[0, 1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              border: "1px solid var(--border-strong)",
              background: n === value ? "var(--accent)" : "transparent",
              padding: 0,
              cursor: "pointer",
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontSize: "12px",
          color: "var(--ink-dim)",
          textAlign: "right",
        }}
      >
        {right}
      </span>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid var(--border)",
  borderRadius: "18px",
  padding: "22px 24px",
  boxShadow: "var(--shadow-card)",
};
const editableText: React.CSSProperties = {
  border: "none",
  outline: "none",
  resize: "none",
  background: "transparent",
  fontFamily: "var(--font-sans)",
  padding: 0,
  margin: 0,
  color: "var(--ink)",
};
const listRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  width: "100%",
  textAlign: "left",
  borderRadius: "14px",
  padding: "11px 12px",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
};
const avatarImg: React.CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "50%",
  objectFit: "cover",
  flexShrink: 0,
};
const avatarPlaceholder: React.CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "50%",
  color: "var(--ink)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  fontWeight: 700,
  flexShrink: 0,
};
const rowName: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 700,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  color: "var(--ink)",
};
const rowRole: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  color: "var(--ink-faint)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const addRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  width: "100%",
  background: "transparent",
  border: "2px dashed var(--border-strong)",
  borderRadius: "14px",
  padding: "11px 12px",
  cursor: "pointer",
  color: "var(--ink-faint)",
  fontWeight: 700,
  fontSize: "13px",
  marginTop: "4px",
  fontFamily: "var(--font-sans)",
};
const primaryBtn: React.CSSProperties = {
  background: "var(--black)",
  color: "#fff",
  border: "none",
  borderRadius: "999px",
  padding: "12px 22px",
  fontWeight: 700,
  fontSize: "14px",
  cursor: "pointer",
};
const dangerBtn: React.CSSProperties = {
  background: "#fff",
  color: "var(--status-draft-fg)",
  border: "1px solid #F0D3DE",
  borderRadius: "999px",
  padding: "9px 16px",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
};
