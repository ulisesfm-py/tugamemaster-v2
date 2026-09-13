// `server-only` lanza al importarse fuera de un componente de servidor, que es
// justo su proposito: impedir que codigo de servidor acabe en el navegador.
//
// Vitest corre en Node, no en un bundle de cliente, asi que esa guarda no
// aplica pero si rompe la importacion. Este doble la neutraliza solo en tests.
export {};
