const {DatabaseSync}=require('node:sqlite');
const {sqliteSql}=require('../../packages/database/catalog');
// Test-only D1 contract over isolated in-memory SQLite.
function localD1(db){
 const prepare=raw=>{const sql=sqliteSql(raw);let args=[];const statement={sql,values:()=>args,bind(...values){args=values;return statement;},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};}};return statement;};
 return {prepare,withSession(){return this;},async batch(statements){db.exec('BEGIN');try{const results=statements.map(s=>({meta:db.prepare(s.sql).run(...s.values()),success:true}));db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}}};
}
module.exports={localD1,DatabaseSync};
