import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
const API_URL = import.meta.env.VITE_API_URL;
const MAX_ATTEMPTS = 3;

function MyAssignments() {
    const { getToken } = useAuth();

    const [assignments, setAssignments] =
        useState([]);

    const [submissions, setSubmissions] =
        useState([]);

    const [selectedAssignment, setSelectedAssignment] =
        useState(null);

    const [selectedFile, setSelectedFile] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [evaluating, setEvaluating] =
        useState(false);

    const [bestScore, setBestScore] =
        useState(null);

    const [attemptsUsed, setAttemptsUsed] =
        useState(0);


    const fetchAssignments = async () => {
        try {
            setLoading(true);

            const token =
                await getToken();

            const [
                assignmentsResponse,
                submissionsResponse
            ] = await Promise.all([
                fetch(
                    `${API_URL}/api/assignments/published`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                ),

                fetch(
                    `${API_URL}/api/submissions/my`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                )
            ]);

            const assignmentsData =
                await assignmentsResponse.json();

            const submissionsData =
                await submissionsResponse.json();

            if (!assignmentsResponse.ok) {
                throw new Error(
                    assignmentsData.message ||
                    "Failed to fetch assignments"
                );
            }

            if (!submissionsResponse.ok) {
                throw new Error(
                    submissionsData.message ||
                    "Failed to fetch submissions"
                );
            }

            setAssignments(
                assignmentsData.assignments || []
            );

            setSubmissions(
                submissionsData.submissions || []
            );

        } catch (error) {
            console.error(
                "Fetch assignments error:",
                error
            );

            toast.error(
                error.message ||
                "Failed to load assignments"
            );

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchAssignments();
    }, []);


    const getSubmissions = (
        assignmentId
    ) => {
        return submissions
            .filter(
                (submission) =>
                    submission.assignment?._id ===
                    assignmentId
            )
            .sort(
                (a, b) =>
                    (a.attemptNumber || 1) -
                    (b.attemptNumber || 1)
            );
    };


    const getBestSubmission = (
        assignmentId
    ) => {
        const attempts =
            getSubmissions(
                assignmentId
            );

        const evaluated =
            attempts.filter(
                (submission) =>
                    submission.status ===
                    "evaluated" &&
                    typeof submission
                        .aiEvaluation?.score ===
                    "number"
            );

        if (!evaluated.length) {
            return null;
        }

        return evaluated.reduce(
            (best, current) => {
                if (!best) {
                    return current;
                }

                return current.aiEvaluation.score >
                    best.aiEvaluation.score
                    ? current
                    : best;
            },
            null
        );
    };


    useEffect(() => {
        if (!selectedAssignment) {
            setAttemptsUsed(0);
            setBestScore(null);
            return;
        }

        const attempts =
            getSubmissions(
                selectedAssignment._id
            );

        const best =
            getBestSubmission(
                selectedAssignment._id
            );

        setAttemptsUsed(
            attempts.length
        );

        setBestScore(
            best
                ? best.aiEvaluation.score
                : null
        );
    }, [
        selectedAssignment,
        submissions
    ]);


    const openAssignment = (
        assignment
    ) => {
        setSelectedAssignment(
            assignment
        );

        setSelectedFile(null);
    };


    const closeAssignment = () => {
        setSelectedAssignment(null);
        setSelectedFile(null);
        setAttemptsUsed(0);
        setBestScore(null);
    };


    const handleFileChange = (e) => {
        const file =
            e.target.files?.[0];

        if (!file) {
            setSelectedFile(null);
            return;
        }

        if (
            file.size >
            10 * 1024 * 1024
        ) {
            toast.error(
                "File size must be less than 10 MB"
            );

            e.target.value = "";
            setSelectedFile(null);

            return;
        }

        setSelectedFile(file);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedAssignment) {
            return;
        }

        const currentAttempts =
            getSubmissions(
                selectedAssignment._id
            );

        if (
            currentAttempts.length >=
            MAX_ATTEMPTS
        ) {
            toast.error(
                "You have already used all 3 attempts"
            );
            return;
        }

        if (!selectedFile) {
            toast.error(
                "Please select a file"
            );
            return;
        }

        try {
            setSubmitting(true);

            const token =
                await getToken();

            const formData =
                new FormData();

            formData.append(
                "assignmentId",
                selectedAssignment._id
            );

            formData.append(
                "file",
                selectedFile
            );

            const response =
                await fetch(
                    `${API_URL}/api/submissions`,
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        },

                        body: formData
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to submit assignment"
                );
            }

            toast.success(
                data.message ||
                "Assignment submitted successfully!"
            );

            setSelectedFile(null);

            await fetchAssignments();

        } catch (error) {
            console.error(
                "Submit assignment error:",
                error
            );

            toast.error(
                error.message ||
                "Failed to submit assignment"
            );

        } finally {
            setSubmitting(false);
        }
    };


    const handleEvaluate = async (
        submissionId
    ) => {
        try {
            setEvaluating(true);

            const token =
                await getToken();

            const response =
                await fetch(
                    `${API_URL}/api/submissions/${submissionId}/evaluate`,
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to evaluate submission"
                );
            }

            toast.success(
                "AI evaluation completed successfully!"
            );

            setSubmissions(
                (current) =>
                    current.map(
                        (submission) =>
                            submission._id ===
                                submissionId
                                ? data.submission
                                : submission
                    )
            );

            setBestScore(
                data.bestScore
            );

        } catch (error) {
            console.error(
                "Evaluate submission error:",
                error
            );

            toast.error(
                error.message ||
                "Failed to evaluate submission"
            );

        } finally {
            setEvaluating(false);
        }
    };


    if (loading) {
        return (
            <div>
                <h1 className="text-3xl font-bold text-white">
                    Assignments
                </h1>

                <p className="mt-2 text-slate-400">
                    Complete assignments and build proof of your skills.
                </p>

                <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
                    Loading assignments...
                </div>
            </div>
        );
    }


    if (selectedAssignment) {
        const assignmentAttempts =
            getSubmissions(
                selectedAssignment._id
            );

        const bestSubmission =
            getBestSubmission(
                selectedAssignment._id
            );

        const canSubmit =
            assignmentAttempts.length <
            MAX_ATTEMPTS;

        return (
            <div>
                <button
                    onClick={closeAssignment}
                    className="mb-6 text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                    ← Back to Assignments
                </button>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white sm:text-3xl">
                                {selectedAssignment.title}
                            </h1>

                            <p className="mt-2 text-slate-400">
                                Created by{" "}
                                {selectedAssignment.createdBy?.firstName}{" "}
                                {selectedAssignment.createdBy?.lastName}
                            </p>
                        </div>

                        <span className="w-fit rounded-full bg-blue-950 px-3 py-1 text-sm font-medium text-blue-400">
                            {selectedAssignment.difficulty}
                        </span>
                    </div>


                    <div className="mt-6">
                        <h2 className="text-lg font-semibold text-white">
                            Description
                        </h2>

                        <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-400">
                            {selectedAssignment.description}
                        </p>
                    </div>


                    {selectedAssignment.skills?.length >
                        0 && (
                            <div className="mt-6">
                                <h2 className="text-lg font-semibold text-white">
                                    Skills
                                </h2>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {selectedAssignment.skills.map(
                                        (
                                            skill,
                                            index
                                        ) => (
                                            <span
                                                key={index}
                                                className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-300"
                                            >
                                                {skill}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        )}


                    <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-4">
                        <p className="text-sm text-slate-400">
                            Deadline
                        </p>

                        <p className="mt-1 font-medium text-white">
                            {new Date(
                                selectedAssignment.deadline
                            ).toLocaleString()}
                        </p>
                    </div>


                    <div className="mt-6 grid gap-4 sm:grid-cols-2">

                        <div className="rounded-xl border border-blue-800 bg-blue-950/30 p-5">
                            <p className="text-sm text-slate-400">
                                Attempts
                            </p>

                            <p className="mt-1 text-3xl font-bold text-blue-400">
                                {attemptsUsed}
                                <span className="text-lg text-slate-500">
                                    /3
                                </span>
                            </p>
                        </div>

                        <div className="rounded-xl border border-purple-800 bg-purple-950/30 p-5">
                            <p className="text-sm text-slate-400">
                                Best AI Score
                            </p>

                            <p className="mt-1 text-3xl font-bold text-purple-400">
                                {bestScore !== null
                                    ? bestScore
                                    : "—"}

                                {bestScore !== null && (
                                    <span className="text-lg text-slate-500">
                                        /100
                                    </span>
                                )}
                            </p>
                        </div>

                    </div>


                    {assignmentAttempts.length >
                        0 && (
                            <div className="mt-8">

                                <h2 className="text-xl font-semibold text-white">
                                    Your Attempts
                                </h2>

                                <div className="mt-4 space-y-5">

                                    {assignmentAttempts.map(
                                        (
                                            submission
                                        ) => (
                                            <div
                                                key={
                                                    submission._id
                                                }
                                                className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                                            >

                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                                                    <div>
                                                        <p className="text-lg font-semibold text-white">
                                                            Attempt{" "}
                                                            {submission.attemptNumber ||
                                                                1}
                                                        </p>

                                                        <p className="mt-1 break-all text-sm text-slate-400">
                                                            {
                                                                submission.file?.fileName
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Submitted{" "}
                                                            {new Date(
                                                                submission.submittedAt
                                                            ).toLocaleString()}
                                                        </p>
                                                    </div>


                                                    <div className="text-left sm:text-right">

                                                        <p className="text-xs text-slate-500">
                                                            Status
                                                        </p>

                                                        <p className="mt-1 text-sm font-medium capitalize text-blue-400">
                                                            {
                                                                submission.status
                                                            }
                                                        </p>

                                                        {submission.status ===
                                                            "evaluated" &&
                                                            submission.aiEvaluation && (
                                                                <p className="mt-2 text-2xl font-bold text-purple-400">
                                                                    {
                                                                        submission
                                                                            .aiEvaluation
                                                                            .score
                                                                    }
                                                                    <span className="text-sm text-slate-500">
                                                                        /100
                                                                    </span>
                                                                </p>
                                                            )}

                                                    </div>

                                                </div>


                                                {submission.status ===
                                                    "submitted" && (
                                                        <button
                                                            onClick={() =>
                                                                handleEvaluate(
                                                                    submission._id
                                                                )
                                                            }
                                                            disabled={
                                                                evaluating
                                                            }
                                                            className="mt-5 w-full rounded-lg bg-purple-600 px-5 py-3 font-medium text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {evaluating
                                                                ? "AI is evaluating..."
                                                                : `Evaluate Attempt ${submission.attemptNumber ||
                                                                1
                                                                } with AI`}
                                                        </button>
                                                    )}


                                                {submission.status ===
                                                    "evaluated" &&
                                                    submission.aiEvaluation && (
                                                        <div className="mt-6 border-t border-slate-800 pt-6">

                                                            <div className="rounded-xl border border-purple-800 bg-purple-950/30 p-5">

                                                                <p className="text-sm text-slate-400">
                                                                    AI Score
                                                                </p>

                                                                <p className="mt-1 text-4xl font-bold text-purple-400">
                                                                    {
                                                                        submission
                                                                            .aiEvaluation
                                                                            .score
                                                                    }

                                                                    <span className="text-lg text-slate-500">
                                                                        /100
                                                                    </span>
                                                                </p>


                                                                <div className="mt-5">
                                                                    <p className="text-sm font-medium text-slate-400">
                                                                        Summary
                                                                    </p>

                                                                    <p className="mt-2 leading-7 text-slate-300">
                                                                        {
                                                                            submission
                                                                                .aiEvaluation
                                                                                .summary
                                                                        }
                                                                    </p>
                                                                </div>


                                                                {submission.aiEvaluation.strengths?.length >
                                                                    0 && (
                                                                        <div className="mt-5">
                                                                            <p className="text-sm font-medium text-green-400">
                                                                                Strengths
                                                                            </p>

                                                                            <ul className="mt-2 space-y-2">
                                                                                {submission.aiEvaluation.strengths.map(
                                                                                    (
                                                                                        strength,
                                                                                        index
                                                                                    ) => (
                                                                                        <li
                                                                                            key={
                                                                                                index
                                                                                            }
                                                                                            className="text-sm text-slate-300"
                                                                                        >
                                                                                            ✓{" "}
                                                                                            {
                                                                                                strength
                                                                                            }
                                                                                        </li>
                                                                                    )
                                                                                )}
                                                                            </ul>
                                                                        </div>
                                                                    )}


                                                                {submission.aiEvaluation.weaknesses?.length >
                                                                    0 && (
                                                                        <div className="mt-5">
                                                                            <p className="text-sm font-medium text-red-400">
                                                                                Weaknesses
                                                                            </p>

                                                                            <ul className="mt-2 space-y-2">
                                                                                {submission.aiEvaluation.weaknesses.map(
                                                                                    (
                                                                                        weakness,
                                                                                        index
                                                                                    ) => (
                                                                                        <li
                                                                                            key={
                                                                                                index
                                                                                            }
                                                                                            className="text-sm text-slate-300"
                                                                                        >
                                                                                            •{" "}
                                                                                            {
                                                                                                weakness
                                                                                            }
                                                                                        </li>
                                                                                    )
                                                                                )}
                                                                            </ul>
                                                                        </div>
                                                                    )}


                                                                {submission.aiEvaluation.suggestions?.length >
                                                                    0 && (
                                                                        <div className="mt-5">
                                                                            <p className="text-sm font-medium text-blue-400">
                                                                                Suggestions
                                                                            </p>

                                                                            <ul className="mt-2 space-y-2">
                                                                                {submission.aiEvaluation.suggestions.map(
                                                                                    (
                                                                                        suggestion,
                                                                                        index
                                                                                    ) => (
                                                                                        <li
                                                                                            key={
                                                                                                index
                                                                                            }
                                                                                            className="text-sm text-slate-300"
                                                                                        >
                                                                                            →{" "}
                                                                                            {
                                                                                                suggestion
                                                                                            }
                                                                                        </li>
                                                                                    )
                                                                                )}
                                                                            </ul>
                                                                        </div>
                                                                    )}


                                                                {bestSubmission?._id ===
                                                                    submission._id && (
                                                                        <div className="mt-5 rounded-lg border border-green-800 bg-green-950/30 px-4 py-3">
                                                                            <p className="text-sm font-medium text-green-400">
                                                                                ✓ Current Best Attempt
                                                                            </p>

                                                                            <p className="mt-1 text-xs text-slate-400">
                                                                                This attempt currently has the highest AI score.
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                            </div>
                                                        </div>
                                                    )}

                                            </div>
                                        )
                                    )}

                                </div>
                            </div>
                        )}


                    {canSubmit ? (
                        <form
                            onSubmit={handleSubmit}
                            className="mt-8"
                        >

                            <h2 className="text-xl font-semibold text-white">
                                Submit Attempt{" "}
                                {attemptsUsed + 1}
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                You can submit up to 3 attempts. Your highest AI score will be used as your best score.
                            </p>


                            <label className="mt-5 block text-sm font-medium text-slate-300">
                                Your Submission
                            </label>

                            <div className="mt-2 rounded-xl border border-dashed border-slate-700 bg-slate-900 p-6">

                                <input
                                    type="file"
                                    onChange={
                                        handleFileChange
                                    }
                                    accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.h,.html,.css,.json,.txt,.zip"
                                    className="block w-full cursor-pointer text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-blue-500"
                                />

                                <p className="mt-3 text-xs text-slate-500">
                                    Supported: JS, JSX, TS, TSX, Python, Java, C, C++, HTML, CSS, JSON, TXT and ZIP
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Maximum file size: 10 MB
                                </p>


                                {selectedFile && (
                                    <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-4">

                                        <p className="text-sm text-slate-400">
                                            Selected file
                                        </p>

                                        <p className="mt-1 break-all font-medium text-white">
                                            {
                                                selectedFile.name
                                            }
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {(
                                                selectedFile.size /
                                                1024 /
                                                1024
                                            ).toFixed(2)}{" "}
                                            MB
                                        </p>

                                    </div>
                                )}

                            </div>


                            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">

                                <button
                                    type="button"
                                    onClick={
                                        closeAssignment
                                    }
                                    className="rounded-lg border border-slate-700 px-5 py-3 font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        submitting ||
                                        !selectedFile
                                    }
                                    className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting
                                        ? "Submitting..."
                                        : `Submit Attempt ${attemptsUsed +
                                        1
                                        }`}
                                </button>

                            </div>

                        </form>
                    ) : (
                        <div className="mt-8 rounded-xl border border-amber-800 bg-amber-950/30 p-5">

                            <p className="text-sm font-semibold text-amber-400">
                                All 3 attempts used
                            </p>

                            <p className="mt-2 text-sm text-slate-400">
                                Your best AI score is{" "}
                                <span className="font-semibold text-purple-400">
                                    {bestScore !== null
                                        ? `${bestScore}/100`
                                        : "not evaluated yet"}
                                </span>
                                .
                            </p>

                        </div>
                    )}

                </div>
            </div>
        );
    }


    return (
        <div>

            <div>
                <h1 className="text-3xl font-bold text-white">
                    Assignments
                </h1>

                <p className="mt-2 text-slate-400">
                    Complete assignments and build proof of your skills.
                </p>
            </div>


            {assignments.length === 0 ? (
                <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-6">

                    <h2 className="text-lg font-semibold text-white">
                        No assignments available
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                        There are currently no published assignments available.
                    </p>

                </div>
            ) : (
                <div className="mt-8 grid gap-6 lg:grid-cols-2">

                    {assignments.map(
                        (assignment) => {
                            const assignmentSubmissions =
                                getSubmissions(
                                    assignment._id
                                );

                            const bestSubmission =
                                getBestSubmission(
                                    assignment._id
                                );

                            const score =
                                bestSubmission
                                    ? bestSubmission.aiEvaluation.score
                                    : null;

                            return (
                                <div
                                    key={
                                        assignment._id
                                    }
                                    className="rounded-xl border border-slate-800 bg-slate-950 p-6"
                                >

                                    <div className="flex items-start justify-between gap-4">

                                        <h2 className="text-xl font-semibold text-white">
                                            {
                                                assignment.title
                                            }
                                        </h2>

                                        <span className="rounded-full bg-blue-950 px-3 py-1 text-xs font-medium text-blue-400">
                                            {
                                                assignment.difficulty
                                            }
                                        </span>

                                    </div>


                                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                                        {
                                            assignment.description
                                        }
                                    </p>


                                    {assignment.skills?.length >
                                        0 && (
                                            <div className="mt-4 flex flex-wrap gap-2">

                                                {assignment.skills.map(
                                                    (
                                                        skill,
                                                        index
                                                    ) => (
                                                        <span
                                                            key={
                                                                index
                                                            }
                                                            className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                                                        >
                                                            {
                                                                skill
                                                            }
                                                        </span>
                                                    )
                                                )}

                                            </div>
                                        )}


                                    <div className="mt-5">

                                        <p className="text-sm text-slate-500">
                                            Deadline
                                        </p>

                                        <p className="mt-1 text-sm text-slate-300">
                                            {new Date(
                                                assignment.deadline
                                            ).toLocaleString()}
                                        </p>

                                    </div>


                                    {assignmentSubmissions.length >
                                        0 && (
                                            <div className="mt-5 grid grid-cols-2 gap-3">

                                                <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
                                                    <p className="text-xs text-slate-500">
                                                        Attempts
                                                    </p>

                                                    <p className="mt-1 font-semibold text-white">
                                                        {
                                                            assignmentSubmissions.length
                                                        }
                                                        /3
                                                    </p>
                                                </div>


                                                <div className="rounded-lg border border-purple-800 bg-purple-950/20 px-4 py-3">
                                                    <p className="text-xs text-slate-500">
                                                        Best Score
                                                    </p>

                                                    <p className="mt-1 font-semibold text-purple-400">
                                                        {score !==
                                                            null
                                                            ? `${score}/100`
                                                            : "—"}
                                                    </p>
                                                </div>

                                            </div>
                                        )}


                                    <button
                                        onClick={() =>
                                            openAssignment(
                                                assignment
                                            )
                                        }
                                        className={`mt-5 w-full rounded-lg px-5 py-3 font-medium transition ${assignmentSubmissions.length >
                                            0
                                            ? "border border-purple-700 bg-purple-950/30 text-purple-400 hover:bg-purple-900/40"
                                            : "bg-blue-600 text-white hover:bg-blue-500"
                                            }`}
                                    >
                                        {assignmentSubmissions.length >
                                            0
                                            ? "View Attempts & AI Evaluation"
                                            : "View & Submit"}
                                    </button>

                                </div>
                            );
                        }
                    )}

                </div>
            )}

        </div>
    );
}

export default MyAssignments;