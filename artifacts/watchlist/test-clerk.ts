import type { SignUpResource } from "@clerk/types";
const test = (s: SignUpResource) => {
    return Object.keys(s);
}
