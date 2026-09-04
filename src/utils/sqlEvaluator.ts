import { SAMPLE_TABLES } from '../data/sampleData';
import { TableData } from '../types';

export interface SQLEvalResult {
  success: boolean;
  columns: string[];
  rows: Record<string, any>[];
  errorMessage?: string;
  rowCount: number;
}

/**
 * Normalizes SQL query for robust semantic matching
 */
export function normalizeSQL(sql: string): string {
  return sql
    .trim()
    .replace(/;/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function resolveTable(tableName: string, tables: Record<string, TableData>): { key: string; data: TableData } | null {
  const clean = tableName.toLowerCase().trim();
  if (tables[clean]) return { key: clean, data: tables[clean] };

  // Common singular to plural or plural to singular mappings
  const aliases: Record<string, string> = {
    order: 'orders',
    orders: 'orders',
    order_detail: 'order_details',
    order_details: 'order_details',
    orderdetail: 'order_details',
    orderdetails: 'order_details',
    student: 'students',
    students: 'students',
    product: 'products',
    products: 'products',
    department: 'departments',
    departments: 'departments',
    employee: 'employees',
    employees: 'employees',
  };

  const mappedKey = aliases[clean];
  if (mappedKey && tables[mappedKey]) {
    return { key: mappedKey, data: tables[mappedKey] };
  }

  // Case insensitive key match
  const found = Object.keys(tables).find((k) => k.toLowerCase() === clean);
  if (found && tables[found]) {
    return { key: found, data: tables[found] };
  }

  return null;
}

/**
 * Simple in-browser SQL simulator for pedagogical purposes
 */
export function executeSimulatedSQL(query: string, customTables?: Record<string, TableData>): SQLEvalResult {
  const tables = customTables || SAMPLE_TABLES;
  const clean = query.trim().replace(/;+$/, '').trim();

  if (!clean) {
    return { success: false, columns: [], rows: [], rowCount: 0, errorMessage: 'คำสั่ง SQL ว่างเปล่า กรุณาระบุคำสั่ง' };
  }

  // Basic SQL command check
  const upper = clean.toUpperCase();
  if (!upper.startsWith('SELECT')) {
    return { success: false, columns: [], rows: [], rowCount: 0, errorMessage: 'คำสั่งต้องเริ่มต้นด้วย SELECT' };
  }

  if (!upper.includes('FROM')) {
    return { success: false, columns: [], rows: [], rowCount: 0, errorMessage: 'ไม่พบคีย์เวิร์ด FROM ในคำสั่ง' };
  }

  try {
    // 1. Identify primary table
    let fromIndex = upper.indexOf('FROM ');
    let afterFrom = clean.substring(fromIndex + 5).trim();
    
    // Check if JOIN exists
    const hasJoin = upper.includes('JOIN');
    
    let tableName = '';
    let joinTable = '';
    let joinCondition = '';
    let whereClause = '';
    let orderByClause = '';
    let isDesc = false;
    let limitCount: number | null = null;
    let groupByCol = '';

    // Extract parts
    let remaining = afterFrom;

    if (upper.includes('LIMIT')) {
      const limitMatch = remaining.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        limitCount = parseInt(limitMatch[1], 10);
        remaining = remaining.substring(0, remaining.search(/LIMIT/i)).trim();
      }
    }

    if (upper.includes('ORDER BY')) {
      const orderMatch = remaining.match(/ORDER\s+BY\s+([a-zA-Z0-9_.]+)(?:\s+(ASC|DESC))?/i);
      if (orderMatch) {
        orderByClause = orderMatch[1];
        isDesc = (orderMatch[2] || '').toUpperCase() === 'DESC';
        remaining = remaining.substring(0, remaining.search(/ORDER\s+BY/i)).trim();
      }
    }

    if (upper.includes('GROUP BY')) {
      const groupMatch = remaining.match(/GROUP\s+BY\s+([a-zA-Z0-9_.]+)/i);
      if (groupMatch) {
        groupByCol = groupMatch[1];
        remaining = remaining.substring(0, remaining.search(/GROUP\s+BY/i)).trim();
      }
    }

    if (upper.includes('WHERE')) {
      const whereMatch = remaining.match(/WHERE\s+(.+)$/i);
      if (whereMatch) {
        whereClause = whereMatch[1].trim();
        remaining = remaining.substring(0, remaining.search(/WHERE/i)).trim();
      }
    }

    if (hasJoin) {
      const joinMatch = remaining.match(/([a-zA-Z0-9_]+)\s+(?:INNER\s+)?JOIN\s+([a-zA-Z0-9_]+)\s+ON\s+(.+)/i);
      if (joinMatch) {
        tableName = joinMatch[1].toLowerCase().trim();
        joinTable = joinMatch[2].toLowerCase().trim();
        joinCondition = joinMatch[3].trim();
      } else {
        tableName = remaining.split(/\s+/)[0].toLowerCase().trim();
      }
    } else {
      tableName = remaining.split(/\s+/)[0].toLowerCase().trim();
    }

    const resolved = resolveTable(tableName, tables);
    if (!resolved) {
      return {
        success: false,
        columns: [],
        rows: [],
        rowCount: 0,
        errorMessage: `ไม่พบตาราง "${tableName}" ในฐานข้อมูล (ตารางที่มีในระบบ: ${Object.keys(tables).join(', ')})`,
      };
    }

    const baseTableData = resolved.data;
    const resolvedTableName = resolved.key;

    // Prepare Working Rows
    let workingRows: Record<string, any>[] = JSON.parse(JSON.stringify(baseTableData.rows));

    // Handle Join
    if (joinTable) {
      const resolvedJoin = resolveTable(joinTable, tables);
      if (resolvedJoin) {
        const joinTableData = resolvedJoin.data;
        const resolvedJoinName = resolvedJoin.key;
        const joinedResult: Record<string, any>[] = [];

        // e.g. employees.dept_id = departments.dept_id
        const onParts = joinCondition.split('=').map((s) => s.trim());
        if (onParts.length === 2) {
          const leftKey = onParts[0].split('.').pop() || '';
          const rightKey = onParts[1].split('.').pop() || '';

          for (const row1 of workingRows) {
            for (const row2 of joinTableData.rows) {
              if (row1[leftKey] == row2[rightKey] || row1[rightKey] == row2[leftKey]) {
                const merged: Record<string, any> = {};
                // Prefixed and plain
                Object.entries(row1).forEach(([k, v]) => {
                  merged[k] = v;
                  merged[`${resolvedTableName}.${k}`] = v;
                });
                Object.entries(row2).forEach(([k, v]) => {
                  merged[k] = v;
                  merged[`${resolvedJoinName}.${k}`] = v;
                });
                joinedResult.push(merged);
              }
            }
          }
          workingRows = joinedResult;
        }
      }
    }

    // Extract Select Columns
    const selectStr = clean.substring(6, fromIndex).trim();
    const isSelectAll = selectStr === '*';

    // Apply WHERE Filtering
    if (whereClause) {
      workingRows = workingRows.filter((row) => {
        return evaluateWhere(whereClause, row);
      });
    }

    // Handle GROUP BY and Aggregations
    if (groupByCol || upper.includes('COUNT(') || upper.includes('AVG(') || upper.includes('SUM(') || upper.includes('MAX(') || upper.includes('MIN(')) {
      workingRows = handleAggregation(selectStr, groupByCol, workingRows);
    } else {
      // Normal projection
      if (!isSelectAll) {
        const requestedCols = selectStr.split(',').map((c) => c.trim());
        workingRows = workingRows.map((row) => {
          const projected: Record<string, any> = {};
          requestedCols.forEach((col) => {
            const cleanCol = col.replace(/AS\s+.+$/i, '').trim();
            const aliasMatch = col.match(/AS\s+([a-zA-Z0-9_]+)/i);
            const outputName = aliasMatch ? aliasMatch[1] : cleanCol.split('.').pop() || cleanCol;
            
            // Look for match
            if (row[cleanCol] !== undefined) {
              projected[outputName] = row[cleanCol];
            } else {
              const lastPart = cleanCol.split('.').pop() || '';
              projected[outputName] = row[lastPart] !== undefined ? row[lastPart] : null;
            }
          });
          return projected;
        });
      }
    }

    // Apply ORDER BY
    if (orderByClause) {
      const colName = orderByClause.split('.').pop() || orderByClause;
      workingRows.sort((a, b) => {
        const valA = a[colName] ?? a[orderByClause];
        const valB = b[colName] ?? b[orderByClause];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return isDesc ? valB - valA : valA - valB;
        }
        return isDesc ? String(valB).localeCompare(String(valA)) : String(valA).localeCompare(String(valB));
      });
    }

    // Apply LIMIT
    if (limitCount !== null && limitCount >= 0) {
      workingRows = workingRows.slice(0, limitCount);
    }

    // Determine Final Columns
    let resultCols: string[] = [];
    if (workingRows.length > 0) {
      resultCols = Object.keys(workingRows[0]).filter((k) => !k.includes('.'));
      if (resultCols.length === 0) {
        resultCols = Object.keys(workingRows[0]);
      }
    } else {
      if (isSelectAll) {
        resultCols = baseTableData.columns.map((c) => c.name);
      } else {
        resultCols = selectStr.split(',').map((c) => {
          const alias = c.match(/AS\s+([a-zA-Z0-9_]+)/i);
          return alias ? alias[1] : c.trim().split('.').pop() || c.trim();
        });
      }
    }

    return {
      success: true,
      columns: resultCols,
      rows: workingRows,
      rowCount: workingRows.length,
    };
  } catch (err: any) {
    return {
      success: false,
      columns: [],
      rows: [],
      rowCount: 0,
      errorMessage: `เกิดข้อผิดพลาดในการประมวลผล: ${err.message || 'รูปแบบคำสั่ง SQL ไม่ถูกต้อง'}`,
    };
  }
}

function evaluateWhere(clause: string, row: Record<string, any>): boolean {
  // Support AND / OR
  if (clause.toUpperCase().includes(' AND ')) {
    const parts = clause.split(/\s+AND\s+/i);
    return parts.every((p) => evaluateSingleCondition(p.trim(), row));
  }
  if (clause.toUpperCase().includes(' OR ')) {
    const parts = clause.split(/\s+OR\s+/i);
    return parts.some((p) => evaluateSingleCondition(p.trim(), row));
  }
  return evaluateSingleCondition(clause, row);
}

function evaluateSingleCondition(cond: string, row: Record<string, any>): boolean {
  // >=, <=, !=, <>, =, >, <, LIKE
  let operator = '=';
  let left = '';
  let right = '';

  if (cond.includes('>=')) {
    operator = '>=';
    [left, right] = cond.split('>=');
  } else if (cond.includes('<=')) {
    operator = '<=';
    [left, right] = cond.split('<=');
  } else if (cond.includes('!=')) {
    operator = '!=';
    [left, right] = cond.split('!=');
  } else if (cond.includes('<>')) {
    operator = '!=';
    [left, right] = cond.split('<>');
  } else if (cond.includes('>')) {
    operator = '>';
    [left, right] = cond.split('>');
  } else if (cond.includes('<')) {
    operator = '<';
    [left, right] = cond.split('<');
  } else if (cond.toUpperCase().includes(' LIKE ')) {
    operator = 'LIKE';
    const parts = cond.split(/\s+LIKE\s+/i);
    left = parts[0];
    right = parts[1];
  } else if (cond.includes('=')) {
    operator = '=';
    [left, right] = cond.split('=');
  } else {
    return true;
  }

  const colKey = left.trim().replace(/^['"`]|['"`]$/g, '').split('.').pop() || '';
  let rawVal = row[colKey];
  if (rawVal === undefined) {
    rawVal = row[left.trim()];
  }

  const targetValStr = right.trim().replace(/^['"`]|['"`]$/g, '');
  const targetNum = Number(targetValStr);
  const isNumberCompare = !isNaN(targetNum) && typeof rawVal === 'number';

  if (isNumberCompare) {
    const numA = Number(rawVal);
    const numB = targetNum;
    switch (operator) {
      case '=': return numA === numB;
      case '!=': return numA !== numB;
      case '>': return numA > numB;
      case '<': return numA < numB;
      case '>=': return numA >= numB;
      case '<=': return numA <= numB;
      default: return false;
    }
  }

  const strA = String(rawVal ?? '').toLowerCase();
  const strB = targetValStr.toLowerCase();

  switch (operator) {
    case '=': return strA === strB;
    case '!=': return strA !== strB;
    case 'LIKE': {
      const regexStr = '^' + strB.replace(/%/g, '.*').replace(/_/g, '.') + '$';
      return new RegExp(regexStr, 'i').test(strA);
    }
    default: return strA === strB;
  }
}

function handleAggregation(selectStr: string, groupCol: string, rows: Record<string, any>[]): Record<string, any>[] {
  const cleanGroupCol = groupCol.split('.').pop() || groupCol;

  if (cleanGroupCol && rows.length > 0) {
    const groups: Record<string, Record<string, any>[]> = {};
    for (const r of rows) {
      const gVal = r[cleanGroupCol] ?? 'unknown';
      if (!groups[gVal]) groups[gVal] = [];
      groups[gVal].push(r);
    }

    const results: Record<string, any>[] = [];
    for (const [key, groupRows] of Object.entries(groups)) {
      const item: Record<string, any> = { [cleanGroupCol]: key };
      if (selectStr.toUpperCase().includes('COUNT(')) {
        item['COUNT(*)'] = groupRows.length;
      }
      if (selectStr.toUpperCase().includes('SUM(')) {
        const sumMatch = selectStr.match(/SUM\(([a-zA-Z0-9_]+)\)/i);
        const col = sumMatch ? sumMatch[1] : '';
        item[`SUM(${col})`] = groupRows.reduce((acc, curr) => acc + (Number(curr[col]) || 0), 0);
      }
      if (selectStr.toUpperCase().includes('AVG(')) {
        const avgMatch = selectStr.match(/AVG\(([a-zA-Z0-9_]+)\)/i);
        const col = avgMatch ? avgMatch[1] : '';
        const total = groupRows.reduce((acc, curr) => acc + (Number(curr[col]) || 0), 0);
        item[`AVG(${col})`] = Math.round((total / groupRows.length) * 100) / 100;
      }
      results.push(item);
    }
    return results;
  }

  // Single aggregate without GROUP BY
  const single: Record<string, any> = {};
  if (selectStr.toUpperCase().includes('COUNT(')) {
    single['COUNT(*)'] = rows.length;
  }
  if (selectStr.toUpperCase().includes('AVG(')) {
    const avgMatch = selectStr.match(/AVG\(([a-zA-Z0-9_]+)\)/i);
    const col = avgMatch ? avgMatch[1] : 'salary';
    const total = rows.reduce((acc, curr) => acc + (Number(curr[col]) || 0), 0);
    const val = rows.length > 0 ? Math.round((total / rows.length) * 100) / 100 : 0;
    
    const alias = selectStr.match(/AS\s+([a-zA-Z0-9_]+)/i);
    const keyName = alias ? alias[1] : `AVG(${col})`;
    single[keyName] = val;
  }
  if (selectStr.toUpperCase().includes('SUM(')) {
    const sumMatch = selectStr.match(/SUM\(([a-zA-Z0-9_]+)\)/i);
    const col = sumMatch ? sumMatch[1] : 'salary';
    const total = rows.reduce((acc, curr) => acc + (Number(curr[col]) || 0), 0);
    const alias = selectStr.match(/AS\s+([a-zA-Z0-9_]+)/i);
    const keyName = alias ? alias[1] : `SUM(${col})`;
    single[keyName] = total;
  }

  return [single];
}

/**
 * Checks if user SQL matches solution semantically or via query execution
 */
export function checkSQLAnswer(
  userSQL: string,
  solutionSQL: string,
  tables?: Record<string, TableData>
): { isCorrect: boolean; feedback: string; userResult?: SQLEvalResult; solutionResult?: SQLEvalResult } {
  const normUser = normalizeSQL(userSQL);
  const normSol = normalizeSQL(solutionSQL);

  // Exact normalized string match
  if (normUser === normSol) {
    const res = executeSimulatedSQL(userSQL, tables);
    return {
      isCorrect: true,
      feedback: 'ถูกต้องยอดเยี่ยม! คำสั่ง SQL ถูกต้องสมบูรณ์แบบ',
      userResult: res,
    };
  }

  // Execute both queries against the database and compare outputs
  const userResult = executeSimulatedSQL(userSQL, tables);
  const solResult = executeSimulatedSQL(solutionSQL, tables);

  if (!userResult.success) {
    return {
      isCorrect: false,
      feedback: userResult.errorMessage || 'คำสั่ง SQL มีข้อผิดพลาดทางไวยากรณ์',
      userResult,
      solutionResult: solResult,
    };
  }

  // If both queries succeed, compare rows and columns output
  if (userResult.success && solResult.success) {
    const sameCount = userResult.rowCount === solResult.rowCount;
    const sameRows = JSON.stringify(userResult.rows) === JSON.stringify(solResult.rows);

    if (sameCount && sameRows) {
      return {
        isCorrect: true,
        feedback: 'ถูกต้อง! ผลลัพธ์ข้อมูลตรงตามที่โจทย์ต้องการ',
        userResult,
        solutionResult: solResult,
      };
    }
  }

  return {
    isCorrect: false,
    feedback: 'คำสั่งรันได้ แต่ผลลัพธ์ข้อมูลยังไม่ตรงกับที่โจทย์ต้องการ ลองตรวจสอบคอลัมน์หรือเงื่อนไขอีกครั้ง',
    userResult,
    solutionResult: solResult,
  };
}
