/**
 * ============================================
 * MIGRACIÓN DE USUARIOS - Legacy a Nuevo Schema
 * ============================================
 * Transforma usuarios del sistema antiguo al nuevo formato
 * con campos de auditoría y estructura actualizada
 */

// Leer datos desde el archivo JSON
const fs = require('fs');
const path = require('path');
const oldUsers = JSON.parse(fs.readFileSync(path.join(__dirname, 'users_legacy.json'), 'utf8'));

/**
 * Transforma un usuario del formato antiguo al nuevo
 */
function transformUser(oldUser) {
  return {
    // IDs y referencias
    id: oldUser.id,
    empresaid: oldUser.empresaid,
    
    // Datos personales
    nombre: oldUser.nombre,
    email: oldUser.email,
    telefono: oldUser.telefono || '',
    
    // Role (ya está en formato correcto JSONB)
    role: oldUser.role,
    
    // Estado
    estatus: oldUser.estatus,
    
    // Campos de auditoría (mantener los originales si existen)
    created_at: oldUser.created_at,
    updated_at: oldUser.created_at, // Usar created_at como updated_at inicial
    created_by: null, // No hay info del creador en datos antiguos
    updated_by: null,
    deleted_at: oldUser.deleted_at,
    deleted_by: null
  };
}

/**
 * Genera el SQL INSERT para Supabase
 */
function generateInsertSQL(users) {
  const sqlStatements = [];
  
  users.forEach(user => {
    const transformed = transformUser(user);
    
    // Escapar comillas simples en strings
    const escapeSql = (str) => str ? str.replace(/'/g, "''") : '';
    
    const sql = `
INSERT INTO public.users (
  id,
  nombre,
  email,
  telefono,
  role,
  empresaid,
  estatus,
  created_at,
  updated_at,
  created_by,
  updated_by,
  deleted_at,
  deleted_by
) VALUES (
  '${transformed.id}',
  '${escapeSql(transformed.nombre)}',
  '${escapeSql(transformed.email)}',
  '${escapeSql(transformed.telefono)}',
  '${transformed.role}'::jsonb,
  ${transformed.empresaid ? `'${transformed.empresaid}'` : 'NULL'},
  '${transformed.estatus}',
  '${transformed.created_at}',
  '${transformed.updated_at}',
  NULL,
  NULL,
  ${transformed.deleted_at ? `'${transformed.deleted_at}'` : 'NULL'},
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  role = EXCLUDED.role,
  empresaid = EXCLUDED.empresaid,
  estatus = EXCLUDED.estatus,
  updated_at = NOW();
`;
    
    sqlStatements.push(sql);
  });
  
  return sqlStatements.join('\n\n');
}

/**
 * Genera JSON para importación directa (alternativa al SQL)
 */
function generateJSON(users) {
  return users.map(transformUser);
}

// ============================================
// EJECUCIÓN
// ============================================

// Ejecutar si se llama directamente
if (require.main === module) {
  
  // Opción 1: Generar SQL
  const sql = generateInsertSQL(oldUsers);
  fs.writeFileSync(path.join(__dirname, 'users_migration.sql'), sql);
  console.log('✅ SQL generado en: users_migration.sql');
  
  // Opción 2: Generar JSON transformado
  const newUsersJson = generateJSON(oldUsers);
  fs.writeFileSync(path.join(__dirname, 'users_transformed.json'), JSON.stringify(newUsersJson, null, 2));
  console.log('✅ JSON transformado en: users_transformed.json');
  
  // Mostrar estadísticas
  console.log('\n📊 Estadísticas de migración:');
  console.log(`   Total usuarios: ${oldUsers.length}`);
  console.log(`   Activos: ${oldUsers.filter(u => u.estatus === 'activo').length}`);
  console.log(`   Inactivos: ${oldUsers.filter(u => u.estatus === 'inactivo').length}`);
  console.log(`   Eliminados: ${oldUsers.filter(u => u.deleted_at).length}`);
  
  // Contar por rol
  const roleCount = {};
  oldUsers.forEach(u => {
    const role = typeof u.role === 'string' ? JSON.parse(u.role) : u.role;
    const tipo = role.tipo;
    roleCount[tipo] = (roleCount[tipo] || 0) + 1;
  });
  console.log('\n👥 Usuarios por rol:');
  Object.entries(roleCount).forEach(([tipo, count]) => {
    console.log(`   ${tipo}: ${count}`);
  });
}

module.exports = {
  transformUser,
  generateInsertSQL,
  generateJSON
};
