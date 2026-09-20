import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSchoolModuleById } from "@/lib/emergency-school/catalog";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("emergency_school_module_progress")
    .select("module_id, status, completed_at")
    .eq("profile_id", user.id)
    .order("updated_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Não foi possível carregar seu progresso na trilha." },
      { status: 500 }
    );
  }

  return NextResponse.json({ progress: data ?? [] });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json()) as {
    moduleId?: string;
    status?: "in_progress" | "completed";
  };

  const moduleId = body.moduleId?.trim();
  const status = body.status;

  if (!moduleId || !status || !["in_progress", "completed"].includes(status)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (!getSchoolModuleById(moduleId)) {
    return NextResponse.json({ error: "Módulo não encontrado." }, { status: 404 });
  }

  const completedAt = status === "completed" ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("emergency_school_module_progress")
    .upsert(
      {
        profile_id: user.id,
        module_id: moduleId,
        status,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,module_id" }
    )
    .select("module_id, status, completed_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Não foi possível salvar seu progresso." },
      { status: 500 }
    );
  }

  return NextResponse.json({ progress: data });
}
