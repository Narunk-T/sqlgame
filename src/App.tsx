/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  QuizModule,
  Question,
  TableData,
  GameSession,
  StudentStats,
} from './types';
import {
  getSavedModules,
  saveModules,
  resetModulesToDefault,
  getCurrentUser,
  setCurrentUser as persistCurrentUser,
  clearCurrentUser,
  getUsersList,
  saveUsersList,
  updateUser,
  approveStudent,
  rejectStudent,
  deleteUser,
  deleteAllStudents,
  getDatabaseTables,
  saveDatabaseTables,
  resetDatabaseTablesToDefault,
  deleteDatabaseTable,
  getGameSessions,
  calculateLeaderboard,
  getSavedGradeLevels,
  addGradeLevel,
  updateGradeLevel,
  deleteGradeLevel,
  resetGradeLevelsToDefault,
  getSavedMajors,
  addMajor,
  updateMajor,
  deleteMajor,
  resetMajorsToDefault,
} from './utils/storage';
import { sound } from './utils/sound';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/Student/StudentDashboard';
import { GamePlay } from './components/Student/GamePlay';
import { TeacherDashboard } from './components/Teacher/TeacherDashboard';
import { AuthModal } from './components/AuthModal';
import { SQLCheatsheetModal } from './components/SQLCheatsheetModal';
import { DatabaseViewerModal } from './components/DatabaseViewerModal';
import { KeyRound, ShieldCheck, GraduationCap } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(getCurrentUser);
  const [usersList, setUsersList] = useState<UserProfile[]>(getUsersList);
  const [modules, setModules] = useState<QuizModule[]>(getSavedModules);
  const [tables, setTables] = useState<Record<string, TableData>>(getDatabaseTables);
  const [sessions, setSessions] = useState<GameSession[]>(getGameSessions);
  const [leaderboard, setLeaderboard] = useState<StudentStats[]>(calculateLeaderboard);
  const [gradeLevels, setGradeLevels] = useState<string[]>(getSavedGradeLevels);
  const [majors, setMajors] = useState<string[]>(getSavedMajors);

  // Active student playing state
  const [activePlayingModule, setActivePlayingModule] = useState<QuizModule | null>(null);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCheatsheetOpen, setIsCheatsheetOpen] = useState(false);
  const [isDatabaseViewerOpen, setIsDatabaseViewerOpen] = useState(false);
  const [databaseViewerInitialTable, setDatabaseViewerInitialTable] = useState<string>('students');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Auto open Auth modal if no user is logged in
  useEffect(() => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
    }
  }, [currentUser]);

  // Refresh leaderboard when sessions change
  const refreshStats = () => {
    setSessions(getGameSessions());
    setLeaderboard(calculateLeaderboard());
  };

  const refreshUsers = () => {
    const list = getUsersList();
    setUsersList(list);
    // If current user was modified, update local state
    if (currentUser) {
      const me = list.find((u) => u.id === currentUser.id);
      if (me) {
        setCurrentUserState(me);
        persistCurrentUser(me);
      }
    }
  };

  // User Selection after successful login
  const handleSelectUser = (user: UserProfile) => {
    setCurrentUserState(user);
    persistCurrentUser(user);
    setActivePlayingModule(null);
    setIsAuthModalOpen(false);
  };

  // Complete and Secure Logout handler
  const handleLogout = () => {
    sound.playClick();
    clearCurrentUser();
    setCurrentUserState(null);
    setActivePlayingModule(null);
    setIsAuthModalOpen(true);
  };

  // Teacher Profile Update
  const handleSaveTeacherProfile = (updatedProfile: UserProfile) => {
    updateUser(updatedProfile);
    setCurrentUserState(updatedProfile);
    persistCurrentUser(updatedProfile);
    setUsersList(getUsersList());
  };

  // Student Approvals & CRUD
  const handleApproveStudent = (studentId: string) => {
    approveStudent(studentId);
    refreshUsers();
  };

  const handleRejectStudent = (studentId: string) => {
    rejectStudent(studentId);
    refreshUsers();
  };

  const handleSaveStudent = (student: UserProfile) => {
    updateUser(student);
    refreshUsers();
  };

  const handleDeleteStudent = (studentId: string) => {
    deleteUser(studentId);
    const remaining = getUsersList();
    setUsersList(remaining);
    // If deleted current user, log out cleanly
    if (currentUser && currentUser.id === studentId) {
      handleLogout();
    }
  };

  const handleDeleteAllStudents = () => {
    const remaining = deleteAllStudents();
    setUsersList(remaining);
    refreshStats();
    // If current logged-in user is a student who got deleted
    if (currentUser && currentUser.role === 'student') {
      handleLogout();
    }
  };

  // Teacher Module Operations
  const handleSaveModule = (moduleData: QuizModule) => {
    const existingIdx = modules.findIndex((m) => m.id === moduleData.id);
    let updatedModules: QuizModule[];
    if (existingIdx >= 0) {
      updatedModules = [...modules];
      updatedModules[existingIdx] = {
        ...moduleData,
        questions: modules[existingIdx].questions, // keep existing questions unless specified
      };
    } else {
      updatedModules = [...modules, { ...moduleData, questions: moduleData.questions || [] }];
    }
    setModules(updatedModules);
    saveModules(updatedModules);
  };

  const handleDeleteModule = (moduleId: string) => {
    const updatedModules = modules.filter((m) => m.id !== moduleId);
    setModules(updatedModules);
    saveModules(updatedModules);
  };

  // Teacher Question Operations
  const handleSaveQuestion = (question: Question, targetModuleId: string) => {
    const updatedModules = modules.map((mod) => {
      // If saving into this module
      if (mod.id === targetModuleId) {
        const existingIdx = mod.questions.findIndex((q) => q.id === question.id);
        let newQuestions = [...mod.questions];
        if (existingIdx >= 0) {
          newQuestions[existingIdx] = { ...question, moduleId: targetModuleId };
        } else {
          newQuestions.push({ ...question, moduleId: targetModuleId });
        }
        return { ...mod, questions: newQuestions };
      } else {
        // Remove from other module if moved
        return {
          ...mod,
          questions: mod.questions.filter((q) => q.id !== question.id),
        };
      }
    });

    setModules(updatedModules);
    saveModules(updatedModules);
  };

  const handleDeleteQuestion = (questionId: string, moduleId: string) => {
    const updatedModules = modules.map((mod) => {
      if (mod.id === moduleId) {
        return {
          ...mod,
          questions: mod.questions.filter((q) => q.id !== questionId),
        };
      }
      return mod;
    });
    setModules(updatedModules);
    saveModules(updatedModules);
  };

  const handleDuplicateQuestion = (question: Question, moduleId: string) => {
    const duplicated: Question = {
      ...question,
      id: `q-dup-${Date.now()}`,
      title: `${question.title} (สำเนา)`,
    };
    handleSaveQuestion(duplicated, moduleId);
  };

  const handleResetModules = () => {
    const def = resetModulesToDefault();
    setModules(def);
  };

  const handleImportModules = (imported: QuizModule[]) => {
    setModules(imported);
    saveModules(imported);
  };

  // Database Table Operations
  const handleSaveTable = (newTableData: TableData, oldTableName?: string) => {
    const updated = { ...tables };
    if (oldTableName && oldTableName !== newTableData.tableName) {
      delete updated[oldTableName];
    }
    updated[newTableData.tableName] = newTableData;
    setTables(updated);
    saveDatabaseTables(updated);
  };

  const handleDeleteTable = (tableName: string) => {
    const updated = deleteDatabaseTable(tableName);
    setTables(updated);
  };

  const handleResetTables = () => {
    const def = resetDatabaseTablesToDefault();
    setTables(def);
  };

  const handleImportTables = (importedTables: Record<string, TableData>) => {
    setTables(importedTables);
    saveDatabaseTables(importedTables);
  };

  // Grade Levels Operations
  const handleAddGradeLevel = (grade: string) => {
    const res = addGradeLevel(grade);
    if (res.success) {
      setGradeLevels(res.grades);
    }
    return res;
  };

  const handleUpdateGradeLevel = (oldGrade: string, newGrade: string) => {
    const res = updateGradeLevel(oldGrade, newGrade);
    if (res.success) {
      setGradeLevels(res.grades);
      // Refresh users and modules in case of cascades
      setUsersList(getUsersList());
      setModules(getSavedModules());
      if (currentUser && currentUser.gradeLevel === oldGrade) {
        setCurrentUserState({ ...currentUser, gradeLevel: newGrade });
      }
    }
    return res;
  };

  const handleDeleteGradeLevel = (grade: string) => {
    const res = deleteGradeLevel(grade);
    if (res.success) {
      setGradeLevels(res.grades);
    }
    return res;
  };

  const handleResetGradeLevels = () => {
    const def = resetGradeLevelsToDefault();
    setGradeLevels(def);
  };

  // Major Operations
  const handleAddMajor = (major: string) => {
    const res = addMajor(major);
    if (res.success) {
      setMajors(res.majors);
    }
    return res;
  };

  const handleUpdateMajor = (oldMajor: string, newMajor: string) => {
    const res = updateMajor(oldMajor, newMajor);
    if (res.success) {
      setMajors(res.majors);
      // Refresh users and modules in case of cascades
      setUsersList(getUsersList());
      setModules(getSavedModules());
      if (currentUser && currentUser.major === oldMajor) {
        setCurrentUserState({ ...currentUser, major: newMajor });
      }
    }
    return res;
  };

  const handleDeleteMajor = (major: string) => {
    const res = deleteMajor(major);
    if (res.success) {
      setMajors(res.majors);
    }
    return res;
  };

  const handleResetMajors = () => {
    const def = resetMajorsToDefault();
    setMajors(def);
  };

  // Sound FX toggle
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

  // Open Database Explorer with initial table
  const handleOpenDatabaseViewer = (tableName?: string) => {
    if (tableName && tables[tableName]) {
      setDatabaseViewerInitialTable(tableName);
    }
    setIsDatabaseViewerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Global Navigation Header */}
      <Navbar
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenCheatsheet={() => setIsCheatsheetOpen(true)}
        onOpenDatabaseViewer={() => handleOpenDatabaseViewer()}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onNavigateHome={() => setActivePlayingModule(null)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-6xl w-full mx-auto">
        {!currentUser ? (
          /* Unauthenticated Landing / Login Screen */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 font-mono font-black text-3xl">
              SQL
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                ยินดีต้อนรับสู่ SQL Quest
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                ระบบจัดการเรียนรู้และเกมฝึกเขียนคำสั่ง SQL สำหรับนักเรียนและอาจารย์ผู้สอน กรุณาเข้าสู่ระบบด้วย Username และ Password เพื่อเริ่มต้น
              </p>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>เข้าสู่ระบบ / สมัครใช้งาน</span>
            </button>
          </div>
        ) : currentUser.role === 'teacher' ? (
          /* Teacher Console */
          <TeacherDashboard
            currentUser={currentUser}
            modules={modules}
            tables={tables}
            sessions={sessions}
            leaderboard={leaderboard}
            usersList={usersList}
            gradeLevels={gradeLevels}
            majors={majors}
            onAddGradeLevel={handleAddGradeLevel}
            onUpdateGradeLevel={handleUpdateGradeLevel}
            onDeleteGradeLevel={handleDeleteGradeLevel}
            onResetGradeLevels={handleResetGradeLevels}
            onAddMajor={handleAddMajor}
            onUpdateMajor={handleUpdateMajor}
            onDeleteMajor={handleDeleteMajor}
            onResetMajors={handleResetMajors}
            onSaveQuestion={handleSaveQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onDuplicateQuestion={handleDuplicateQuestion}
            onResetModules={handleResetModules}
            onImportModules={handleImportModules}
            onOpenTableViewer={handleOpenDatabaseViewer}
            onApproveStudent={handleApproveStudent}
            onRejectStudent={handleRejectStudent}
            onSaveStudent={handleSaveStudent}
            onDeleteStudent={handleDeleteStudent}
            onDeleteAllStudents={handleDeleteAllStudents}
            onSaveTeacherProfile={handleSaveTeacherProfile}
            onSaveModule={handleSaveModule}
            onDeleteModule={handleDeleteModule}
            onSaveTable={handleSaveTable}
            onDeleteTable={handleDeleteTable}
            onResetTables={handleResetTables}
            onImportTables={handleImportTables}
          />
        ) : activePlayingModule ? (
          /* Active Student Game Playing */
          <GamePlay
            moduleData={activePlayingModule}
            currentUser={currentUser}
            tables={tables}
            onExit={() => {
              setActivePlayingModule(null);
              refreshStats();
            }}
            onOpenTableViewer={handleOpenDatabaseViewer}
          />
        ) : (
          /* Student Dashboard */
          <StudentDashboard
            currentUser={currentUser}
            modules={modules}
            tables={tables}
            sessions={sessions}
            leaderboard={leaderboard}
            onStartModule={(mod) => setActivePlayingModule(mod)}
            onOpenCheatsheet={() => setIsCheatsheetOpen(true)}
            onOpenDatabaseViewer={() => handleOpenDatabaseViewer()}
          />
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        usersList={usersList}
        gradeLevels={gradeLevels}
        majors={majors}
        onSelectUser={handleSelectUser}
        onLogout={handleLogout}
        onRefreshUsers={refreshUsers}
      />

      <SQLCheatsheetModal
        isOpen={isCheatsheetOpen}
        onClose={() => setIsCheatsheetOpen(false)}
      />

      <DatabaseViewerModal
        isOpen={isDatabaseViewerOpen}
        onClose={() => setIsDatabaseViewerOpen(false)}
        tables={tables}
        initialTable={databaseViewerInitialTable}
      />
    </div>
  );
}
