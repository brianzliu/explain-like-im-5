-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Turn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "audioId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Turn_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Turn" ("answer", "audioId", "chatId", "concept", "createdAt", "id", "question") SELECT "answer", "audioId", "chatId", "concept", "createdAt", "id", "question" FROM "Turn";
DROP TABLE "Turn";
ALTER TABLE "new_Turn" RENAME TO "Turn";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
