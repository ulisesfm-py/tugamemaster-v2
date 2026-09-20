-- CreateEnum
CREATE TYPE "GameExperience" AS ENUM ('ABIERTA', 'ALGUNA', 'VETERANA');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "experience" "GameExperience" NOT NULL DEFAULT 'ABIERTA',
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "minAge" INTEGER,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Las partidas que ya existian heredan los idiomas de su game master: hasta
-- ahora era lo unico que la web ensenaba, asi que no se pierde informacion ni
-- se inventa ninguna. Las de un GM que no declaro idiomas se quedan vacias, y
-- para esas la ficha sigue cayendo a los del GM al leerlas.
UPDATE "Game" g
SET "languages" = p."languages"
FROM "GmProfile" p
WHERE g."gmId" = p."id"
  AND cardinality(g."languages") = 0
  AND cardinality(p."languages") > 0;
