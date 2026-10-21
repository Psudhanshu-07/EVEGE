package com.college.eventmanager.service;

/** Small shared constants + helpers for building student profile defaults. */
public final class SignupProfileDefaults {

    private SignupProfileDefaults() {}

    public static final String DEFAULT_COLLEGE = "EVEGE College Central";
    public static final String DEFAULT_BRANCH = "Computer Science";
    public static final String DEFAULT_YEAR = "1st Year";
    public static final String DEFAULT_DIVISION = "A";

    /** Divisions supported by the leaderboard. */
    public static final java.util.List<String> DIVISIONS = java.util.List.of("A", "B", "C", "D", "E");
}
