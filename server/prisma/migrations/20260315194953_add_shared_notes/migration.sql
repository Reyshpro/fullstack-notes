-- CreateTable
CREATE TABLE "SharedNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "noteId" INTEGER NOT NULL,
    "sharedWithEmail" TEXT NOT NULL,
    CONSTRAINT "SharedNote_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SharedNote_sharedWithEmail_fkey" FOREIGN KEY ("sharedWithEmail") REFERENCES "User" ("email") ON DELETE RESTRICT ON UPDATE CASCADE
);
