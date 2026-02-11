import bcrypt from "bcrypt";

const password = "NeonPlay@0604";

const hash = await bcrypt.hash(password, 10);
console.log(hash);
