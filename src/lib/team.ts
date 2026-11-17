export const teamHierarchy = [
  { name: "Gestão", roles: ["CEO"] },
  { name: "Direção", roles: ["Diretor Conteúdo", "Diretor de Marketing"] },
  {
    name: "Administração",
    roles: [
      "Administrador de Rádio",
      "Administrador de Conteúdo",
      "Administrador de Marketing",
      "Administrador de Promotoria",
      "Administrador de Valores",
    ],
  },
  {
    name: "Coordenação",
    roles: ["Coordenador de Rádio", "Coordenador de Promotoria", "Coordenador de Valores"],
  },
  {
    name: "Supervisão",
    roles: [
      "Supervisor de Rádio",
      "Supervisor de Conteúdo",
      "Supervisor de Marketing",
      "Supervisor de Promotoria",
      "Supervisor de Valores",
    ],
  },
  { name: "Análise", roles: ["Analista de Rádio", "Analista Marketing", "Analista Promotoria"] },
  {
    name: "Equipe Base",
    roles: [
      "Locutor",
      "Sonoplasta",
      "Jornalista",
      "Designer Marketing",
      "Divulgador Marketing",
      "Social Media",
      "Promotor de Eventos",
      "Programador Promotoria",
      "Valorista",
      "Comissário de Recordes",
      "Construtor",
      "Pixel Artista Criativa",
    ],
  },
];
export const teamRoles = teamHierarchy.flatMap((group) => group.roles);
