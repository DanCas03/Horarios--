"use client";

import { ChevronDown } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { subjectsAPI } from "@/api/client";

export interface TeacherOption {
	id: string;
	name: string;
}

interface SectionWithTeachers {
	id: string;
	code: string;
	teacherIds: string[];
	teachers: string[];
	teacherOptions: TeacherOption[];
}

export interface TeacherPickerValue {
	sectionId: string;
	teacherIds: string[];
	fallbackTeacherId: string; // '' | teacherId | 'no-encuentro-profe'
	notFoundTeacherNames: string;
}

const EMPTY_VALUE: TeacherPickerValue = {
	sectionId: "",
	teacherIds: [],
	fallbackTeacherId: "",
	notFoundTeacherNames: "",
};

export function isTeacherPickerValid(value: TeacherPickerValue): boolean {
	if (value.teacherIds.length > 0) return true;
	if (value.fallbackTeacherId === "no-encuentro-profe") {
		return !!value.notFoundTeacherNames.trim();
	}
	return false;
}

// ─── Buscador completo de profesores (todos los de la BD) ─────────────────
// Copiado tal cual del TeacherCombobox que hoy vive en encuesta/page.tsx.
function TeacherCombobox({
	id,
	value,
	onChange,
	options,
}: {
	id?: string;
	value: string;
	onChange: (teacherId: string) => void;
	options: TeacherOption[];
}) {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);

	const selectedTeacher = options.find((t) => t.id === value);
	const displayName =
		value === "no-encuentro-profe"
			? "No encuentro mi profe"
			: selectedTeacher
				? selectedTeacher.name
				: "";

	useEffect(() => {
		setQuery(displayName);
	}, [displayName]);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const filtered = options.filter((t) =>
		t.name.toLowerCase().includes(query.toLowerCase()),
	);
	const specialOption = {
		id: "no-encuentro-profe",
		name: "No encuentro mi profe",
	};
	const showSpecial =
		"no encuentro mi profe".includes(query.toLowerCase()) || query === "";

	return (
		<div ref={wrapperRef} className="relative">
			<div className="relative">
				<input
					id={id}
					required
					value={query}
					onChange={(e: ChangeEvent<HTMLInputElement>) => {
						setQuery(e.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					placeholder="Buscar profesor..."
					className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
				/>
				<ChevronDown
					size={15}
					className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-400"
				/>
			</div>
			{open && (showSpecial || filtered.length > 0) && (
				<ul className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
					{showSpecial && (
						<li key={specialOption.id}>
							<button
								type="button"
								onMouseDown={() => {
									onChange(specialOption.id);
									setOpen(false);
								}}
								className="flex w-full items-center gap-2 border-gray-100 border-b px-3 py-2 text-left font-semibold text-primary text-sm hover:bg-primary/5"
							>
								{specialOption.name}
							</button>
						</li>
					)}
					{filtered.map((t) => (
						<li key={t.id}>
							<button
								type="button"
								onMouseDown={() => {
									onChange(t.id);
									setOpen(false);
								}}
								className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary/5"
							>
								<span className="truncate text-gray-700">{t.name}</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

// ─── Combobox de profesores de la materia+periodo, con salida a full-search ─
function SubjectTeacherCombobox({
	id,
	value,
	onChange,
	onNotFound,
	options,
}: {
	id?: string;
	value: string; // teacherId seleccionado, o ""
	onChange: (teacherId: string) => void;
	onNotFound: () => void;
	options: TeacherOption[];
}) {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);

	const selected = options.find((t) => t.id === value);
	const displayName = selected ? selected.name : "";

	useEffect(() => {
		setQuery(displayName);
	}, [displayName]);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const filtered = options.filter((t) =>
		t.name.toLowerCase().includes(query.toLowerCase()),
	);
	const showSpecial =
		"no encuentro mi profesor".includes(query.toLowerCase()) || query === "";

	return (
		<div ref={wrapperRef} className="relative">
			<div className="relative">
				<input
					id={id}
					required
					value={query}
					onChange={(e: ChangeEvent<HTMLInputElement>) => {
						setQuery(e.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					placeholder="Buscar profesor de esta materia..."
					className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
				/>
				<ChevronDown
					size={15}
					className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-400"
				/>
			</div>
			{open && (showSpecial || filtered.length > 0) && (
				<ul className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
					{showSpecial && (
						<li key="no-encuentro-profesor">
							<button
								type="button"
								onMouseDown={() => {
									onNotFound();
									setOpen(false);
								}}
								className="flex w-full items-center gap-2 border-gray-100 border-b px-3 py-2 text-left font-semibold text-primary text-sm hover:bg-primary/5"
							>
								No encuentro mi profesor
							</button>
						</li>
					)}
					{filtered.map((t) => (
						<li key={t.id}>
							<button
								type="button"
								onMouseDown={() => {
									onChange(t.id);
									setOpen(false);
								}}
								className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary/5"
							>
								<span className="truncate text-gray-700">{t.name}</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

// ─── TeacherPicker principal ────────────────────────────────────────────────
export function TeacherPicker({
	id,
	subjectId,
	periodId,
	allTeachers,
	value,
	onChange,
}: {
	id?: string;
	subjectId: string | undefined;
	periodId: string;
	allTeachers: TeacherOption[];
	value: TeacherPickerValue;
	onChange: (updates: Partial<TeacherPickerValue>) => void;
}) {
	const [sections, setSections] = useState<SectionWithTeachers[]>([]);
	const [loadingSections, setLoadingSections] = useState(false);
	const [mode, setMode] = useState<"subject-teachers" | "full-search">(
		"subject-teachers",
	);
	// Solo para mostrar el nombre elegido en el combobox de materia;
	// no se expone al padre (teacherIds puede traer co-profesores en otro orden).
	const [selectedSubjectTeacherId, setSelectedSubjectTeacherId] = useState("");

	// biome-ignore lint/correctness/useExhaustiveDependencies: onChange puede cambiar de identidad en cada render; solo debe resetear al cambiar materia/periodo
	useEffect(() => {
		if (!subjectId || !periodId) {
			setSections([]);
			setMode("subject-teachers");
			setSelectedSubjectTeacherId("");
			onChange({ ...EMPTY_VALUE });
			return;
		}
		setLoadingSections(true);
		subjectsAPI
			.sections(subjectId, periodId)
			.then((res) => {
				setSections(res.data as SectionWithTeachers[]);
				setMode("subject-teachers");
				setSelectedSubjectTeacherId("");
				onChange({ ...EMPTY_VALUE });
			})
			.catch(() => {
				setSections([]);
				setMode("subject-teachers");
				setSelectedSubjectTeacherId("");
				onChange({ ...EMPTY_VALUE });
			})
			.finally(() => setLoadingSections(false));
	}, [subjectId, periodId]);

	const subjectTeachers: TeacherOption[] = Array.from(
		new Map(
			sections.flatMap((s) => s.teacherOptions).map((t) => [t.id, t]),
		).values(),
	);

	const noSections =
		!loadingSections && !!subjectId && !!periodId && sections.length === 0;
	const effectiveMode = noSections ? "full-search" : mode;

	const teacherSections = selectedSubjectTeacherId
		? sections.filter((s) => s.teacherIds.includes(selectedSubjectTeacherId))
		: [];

	const handlePickSubjectTeacher = (teacherId: string) => {
		setSelectedSubjectTeacherId(teacherId);
		const matchingSections = sections.filter((s) =>
			s.teacherIds.includes(teacherId),
		);
		if (matchingSections.length === 1) {
			const s = matchingSections[0];
			onChange({
				sectionId: s.id,
				teacherIds: s.teacherIds,
				fallbackTeacherId: "",
				notFoundTeacherNames: "",
			});
		} else {
			onChange({
				sectionId: "",
				teacherIds: [teacherId],
				fallbackTeacherId: "",
				notFoundTeacherNames: "",
			});
		}
	};

	const handleGoFullSearch = () => {
		setMode("full-search");
		setSelectedSubjectTeacherId("");
		onChange({ ...EMPTY_VALUE });
	};

	const handleBackToSubjectTeachers = () => {
		setMode("subject-teachers");
		onChange({ ...EMPTY_VALUE });
	};

	if (loadingSections) {
		return <p className="text-gray-400 text-sm">Cargando profesores...</p>;
	}

	if (effectiveMode === "full-search") {
		return (
			<div className="space-y-2">
				{noSections && (
					<p className="flex items-center gap-1.5 font-semibold text-amber-700 text-xs">
						⚠️ No se encontraron secciones para esta materia en este período.
					</p>
				)}
				<TeacherCombobox
					id={id}
					value={value.fallbackTeacherId}
					onChange={(teacherId) =>
						onChange({
							fallbackTeacherId: teacherId,
							teacherIds: teacherId === "no-encuentro-profe" ? [] : [teacherId],
							notFoundTeacherNames:
								teacherId === "no-encuentro-profe"
									? value.notFoundTeacherNames
									: "",
						})
					}
					options={allTeachers}
				/>
				{value.fallbackTeacherId === "no-encuentro-profe" && (
					<input
						type="text"
						required
						value={value.notFoundTeacherNames}
						onChange={(e) => onChange({ notFoundTeacherNames: e.target.value })}
						placeholder="Escribe el nombre completo aquí..."
						className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
					/>
				)}
				{!noSections && (
					<button
						type="button"
						onClick={handleBackToSubjectTeachers}
						className="text-primary text-xs hover:underline"
					>
						← Volver a profesores de la materia
					</button>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<SubjectTeacherCombobox
				id={id}
				value={selectedSubjectTeacherId}
				onChange={handlePickSubjectTeacher}
				onNotFound={handleGoFullSearch}
				options={subjectTeachers}
			/>
			{teacherSections.length > 1 && (
				<select
					value={value.sectionId}
					onChange={(e) => {
						const s = teacherSections.find((sec) => sec.id === e.target.value);
						if (s) onChange({ sectionId: s.id, teacherIds: s.teacherIds });
					}}
					className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
				>
					<option value="">¿En qué sección? (opcional)</option>
					{teacherSections.map((s) => (
						<option key={s.id} value={s.id}>
							Sección {s.code || "Sin código"}
						</option>
					))}
				</select>
			)}
		</div>
	);
}
