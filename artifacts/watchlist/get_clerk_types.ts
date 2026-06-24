import { useSignUp } from "@clerk/react";

const signUpResult = useSignUp();
console.log(Object.keys(signUpResult));
