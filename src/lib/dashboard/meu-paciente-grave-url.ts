export function meuPacienteGraveT0Url(episodeId: string) {
  return `/dashboard/meu-paciente-grave?episode=${encodeURIComponent(episodeId)}`;
}
