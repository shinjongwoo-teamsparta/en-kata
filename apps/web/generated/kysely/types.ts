import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Account = {
    id: string;
    user_id: string;
    type: string;
    provider: string;
    provider_account_id: string;
    refresh_token: string | null;
    access_token: string | null;
    expires_at: number | null;
    token_type: string | null;
    scope: string | null;
    id_token: string | null;
    session_state: string | null;
};
export type GameResult = {
    id: string;
    user_id: string;
    mode: string;
    difficulty: string;
    duration: number;
    language: string | null;
    category: string | null;
    wpm: number;
    cpm: number;
    accuracy: number;
    total_chars: number;
    correct_chars: number;
    total_words: number;
    completed_words: number;
    mistake_map: unknown;
    wpm_timeline: unknown;
    created_at: Generated<Timestamp>;
};
export type Session = {
    id: string;
    session_token: string;
    user_id: string;
    expires: Timestamp;
};
export type User = {
    id: string;
    name: string | null;
    email: string | null;
    email_verified: Timestamp | null;
    image: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type VerificationToken = {
    identifier: string;
    token: string;
    expires: Timestamp;
};
export type DB = {
    accounts: Account;
    game_results: GameResult;
    sessions: Session;
    users: User;
    verification_tokens: VerificationToken;
};
