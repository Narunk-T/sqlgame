import React, { useState } from 'react';
import { BookOpen, X, Code, Copy, Check } from 'lucide-react';

interface SQLCheatsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CheatsheetItem {
  category: string;
  syntax: string;
  description: string;
  example: string;
  outputNote: string;
}

const CHEATSHEET_DATA: CheatsheetItem[] = [
  {
    category: '1. ดึงข้อมูลพื้นฐาน (Basic SELECT)',
    syntax: 'SELECT column1, column2 FROM table_name;',
    description: 'เลือกเฉพาะคอลัมน์ที่ต้องการจากตาราง โดยคั่นด้วยเครื่องหมายจุลภาค (,)',
    example: 'SELECT name, gpa FROM students;',
    outputNote: 'แสดงเฉพาะชื่อและเกรดของนักเรียน',
  },
  {
    category: '1. ดึงข้อมูลพื้นฐาน (Select All)',
    syntax: 'SELECT * FROM table_name;',
    description: 'ใช้เครื่องหมายดอกจัน (*) เพื่อเลือกดูข้อมูลทุกคอลัมน์ในตาราง',
    example: 'SELECT * FROM products;',
    outputNote: 'แสดงทุกคอลัมน์ของสินค้าทั้งหมด',
  },
  {
    category: '2. กรองข้อมูลตามเงื่อนไข (WHERE Clause)',
    syntax: 'SELECT * FROM table_name WHERE condition;',
    description: 'กำหนดเงื่อนไข เช่น =, >, <, >=, <=, != หรือเชื่อมด้วย AND / OR',
    example: "SELECT * FROM students WHERE gpa >= 3.50 AND city = 'กรุงเทพฯ';",
    outputNote: 'แสดงนักเรียนที่มีเกรด 3.5 ขึ้นไปและอยู่ในกรุงเทพฯ',
  },
  {
    category: '2. ค้นหาข้อความบางส่วน (LIKE)',
    syntax: "SELECT * FROM table_name WHERE column LIKE '%pattern%';",
    description: 'ใช้ % แทนข้อความใดๆ เช่น LIKE \'%ก%\' คือมีตัว ก อยู่ข้างใน',
    example: "SELECT * FROM students WHERE major LIKE '%คอมพิวเตอร์%';",
    outputNote: 'ค้นหาสาขาที่มีคำว่าคอมพิวเตอร์',
  },
  {
    category: '3. เรียงลำดับข้อมูล (ORDER BY)',
    syntax: 'SELECT * FROM table_name ORDER BY column ASC|DESC;',
    description: 'ASC = น้อยไปมาก (ค่าเริ่มต้น), DESC = มากไปน้อย',
    example: 'SELECT name, price FROM products ORDER BY price DESC;',
    outputNote: 'เรียงสินค้าจากราคาแพงที่สุดไปถูกที่สุด',
  },
  {
    category: '3. จำกัดจำนวนแถว (LIMIT)',
    syntax: 'SELECT * FROM table_name LIMIT number;',
    description: 'ตัดแสดงผลเฉพาะ N แถวแรกที่ได้จากผลลัพธ์',
    example: 'SELECT * FROM students ORDER BY gpa DESC LIMIT 3;',
    outputNote: 'แสดงนักเรียนที่ได้เกรดสูงสุด 3 อันดับแรก',
  },
  {
    category: '4. ฟังก์ชันรวมกลุ่ม (Aggregation Functions)',
    syntax: 'SELECT COUNT(*), AVG(column), SUM(column), MAX(column), MIN(column) FROM table_name;',
    description: 'COUNT = นับจำนวนแถว, AVG = หาค่าเฉลี่ย, SUM = ผลรวม, MAX = ค่าสูงสุด, MIN = ค่าต่ำสุด',
    example: 'SELECT COUNT(*), AVG(salary) FROM employees;',
    outputNote: 'นับจำนวนพนักงานและคำนวณเงินเดือนเฉลี่ย',
  },
  {
    category: '4. จัดกลุ่มข้อมูล (GROUP BY)',
    syntax: 'SELECT column, COUNT(*) FROM table_name GROUP BY column;',
    description: 'จัดกลุ่มแถวที่มีค่าในคอลัมน์เดียวกัน แล้วหาค่าสถิติในแต่ละกลุ่ม',
    example: 'SELECT dept_id, COUNT(*), AVG(salary) FROM employees GROUP BY dept_id;',
    outputNote: 'สรุปจำนวนคนและเงินเดือนเฉลี่ยแยกตามแผนก',
  },
  {
    category: '5. การเชื่อมตาราง (INNER JOIN)',
    syntax: 'SELECT t1.col1, t2.col2 FROM table1 t1 INNER JOIN table2 t2 ON t1.key = t2.key;',
    description: 'เชื่อมโยงข้อมูลระหว่างสองตารางผ่าน Primary Key และ Foreign Key ที่ตรงกัน',
    example: 'SELECT employees.first_name, departments.dept_name FROM employees INNER JOIN departments ON employees.dept_id = departments.dept_id;',
    outputNote: 'แสดงชื่อพนักงานคู่กับชื่อแผนกที่สังกัด',
  },
  {
    category: '6. วิเคราะห์คำสั่งซื้อ (Orders & Order Details)',
    syntax: 'SELECT customer_name, total_amount FROM orders WHERE status = \'Completed\';',
    description: 'ค้นหาและวิเคราะห์ยอดการสั่งซื้อสินค้าที่มีสถานะเสร็จสมบูรณ์',
    example: 'SELECT * FROM orders WHERE total_amount >= 5000 ORDER BY total_amount DESC;',
    outputNote: 'แสดงคำสั่งซื้อที่มียอดตั้งแต่ 5,000 บาทขึ้นไปเรียงจากมากไปน้อย',
  },
  {
    category: '6. สรุปยอดขายรายการสินค้า (Order Details & SUM)',
    syntax: 'SELECT product_name, SUM(quantity), SUM(subtotal) FROM order_details GROUP BY product_name;',
    description: 'รวมจำนวนชิ้นและยอดขายรวมแยกตามชื่อสินค้าในตาราง order_details',
    example: 'SELECT product_name, quantity, subtotal FROM order_details WHERE quantity > 1;',
    outputNote: 'แสดงรายการสั่งซื้อสินค้าที่มีการสั่งตั้งแต่ 2 ชิ้นขึ้นไป',
  },
];

export const SQLCheatsheetModal: React.FC<SQLCheatsheetModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const filtered = CHEATSHEET_DATA.filter(
    (item) =>
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.syntax.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.example.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                คู่มือสรุปคำสั่ง SQL (Cheat Sheet)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                สรุปโครงสร้างคำสั่ง SQL พื้นฐานเพื่อการเรียนรู้และการทำภารกิจ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <input
            type="text"
            placeholder="ค้นหาคำสั่ง เช่น SELECT, WHERE, JOIN, ORDER BY..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">ไม่พบคู่มือที่ตรงกับคำค้นหา</div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    {item.category}
                  </span>
                  <button
                    onClick={() => handleCopy(item.example, idx)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="คัดลอกตัวอย่าง"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอกโค้ด</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">{item.description}</p>

                {/* Syntax */}
                <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-xs mb-2 overflow-x-auto">
                  <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">โครงสร้าง:</div>
                  <code className="text-sky-300">{item.syntax}</code>
                </div>

                {/* Example */}
                <div className="bg-blue-950/80 text-blue-100 p-2.5 rounded-lg font-mono text-xs flex items-start gap-2 overflow-x-auto">
                  <Code className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-blue-300 text-[10px] uppercase tracking-wider mb-0.5">ตัวอย่างการใช้งาน:</div>
                    <code className="text-amber-200 font-semibold">{item.example}</code>
                    <div className="text-[11px] text-slate-300 mt-1 font-sans">💡 {item.outputNote}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
