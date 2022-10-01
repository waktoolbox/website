import {DbHelper} from "../../db/pg-helper";

export interface LightTournament {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
}

export interface LightMatch {
    // TODO
}

export interface TournamentHome {
    featuredTournaments: LightTournament[];
    nextMatches: LightMatch[];
    registration: LightTournament[];
}


export const TournamentHomeProvider = new (class {
    interval?: number;
    cachedHome?: TournamentHome;

    getHome(): Promise<TournamentHome> {
        return new Promise(resolve => {
            if (!this.interval) {
                setInterval(this.refreshHome, 5 * 60 * 1000);
                this.refreshHome().then(() => resolve(this.cachedHome as TournamentHome))
                return;
            }

            resolve(this.cachedHome as TournamentHome);
        });
    }

    refreshHome(): Promise<void> {
        return new Promise(resolve => {
            const featuredPromise = DbHelper.rawQuery(`
                SELECT id,
                       content -> ('name')      as name,
                       content -> ('startDate') as startDate,
                       content -> ('endDate')   as endDate
                FROM tournaments
                WHERE featured = true
                ORDER BY content -> ('startDate')
                LIMIT 5
            `, []);

            // TODO next matches
            const matchesPromise = DbHelper.rawQuery("SELECT 1", []);

            const registrationPromise = DbHelper.rawQuery(`
                SELECT id,
                       content -> ('name')      as name,
                       content -> ('startDate') as startDate,
                       content -> ('endDate')   as endDate
                FROM tournaments
                WHERE content ->> ('startDate') > $1
                ORDER BY content -> ('startDate')
            `, [new Date().toISOString()])

            Promise.all([featuredPromise, matchesPromise, registrationPromise])
                .then((results: any[]) => {
                    this.cachedHome = {
                        featuredTournaments: [...results[0].rows],
                        nextMatches: [...results[1].rows],
                        registration: [...results[2].rows],
                    }
                    resolve();
                })
                .catch(error => {
                    console.error(error);
                })
        });
    }
})()