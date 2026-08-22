"use client";

import { useMemo, useState } from "react";
import { FilterIcon, SearchIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReviewData } from "./types";

export function Roster({ data }: { data: ReviewData }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const students = useMemo(
    () =>
      data.students.filter((student) => {
        const matchesQuery = [
          student.name,
          student.intendedMajor,
          student.applicationYear?.toString(),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesFilter =
          filter === "all" ||
          (filter === "overdue" && student.overdueTasks > 0) ||
          (filter === "onboarding" && !student.onboardingCompleted) ||
          (filter === "stalled" && (student as typeof student & { stalled?: boolean }).stalled);
        return matchesQuery && matchesFilter;
      }),
    [data.students, filter, query],
  );
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Assigned students</CardTitle>
            <CardDescription>
              Only students with an active, explicit counselor assignment are
              visible.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <SearchIcon className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                className="w-64 pl-9"
                placeholder="Student, major, year"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44">
                <FilterIcon />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                <SelectItem value="overdue">Overdue work</SelectItem>
                <SelectItem value="onboarding">
                  Onboarding incomplete
                </SelectItem>
                <SelectItem value="stalled">Stalled projects</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {students.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Application year</TableHead>
                <TableHead>Intended major</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Health Indicator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.applicationYear ?? "Not set"}</TableCell>
                  <TableCell>{student.intendedMajor}</TableCell>
                  <TableCell>{student.projectCount}</TableCell>
                  <TableCell>
                    {student.overdueTasks ? (
                      <Badge variant="secondary">{student.overdueTasks}</Badge>
                    ) : (
                      <Badge variant="outline">0</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {(student as typeof student & { stalled?: boolean }).stalled ? (
                      <Badge variant="destructive" className="bg-destructive/15 text-destructive hover:bg-destructive/15">
                        Stalled &gt;10 days
                      </Badge>
                    ) : student.projectCount > 0 ? (
                      <Badge variant="outline" className="border-success/30 text-success">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        No projects
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No assigned students match the current filters.
          </p>
        )}
      </CardContent>
    </Card>
  );
}