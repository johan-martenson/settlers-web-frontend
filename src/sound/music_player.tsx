import React, { useEffect, useState } from 'react'
import { Button, ToggleButton } from '@fluentui/react-components'
import ExpandCollapseToggle from '../expand_collapse_toggle'
import './music_player.css'
import { FastForward24Filled, Pause24Filled, Play24Filled } from '@fluentui/react-icons'

interface AudioAtlasSongs {
    path: string
    title: string
}

interface SongAndTitle {
    title: string
    song: HTMLAudioElement
}

interface MusicPlayerProps {
    volume: number
}

type Mode = 'LOOP_SONG' | 'LOOP_LIST' | 'SHUFFLE_LIST'

const MusicPlayer = ({ volume }: MusicPlayerProps) => {

    const [expanded, setExpanded] = useState<boolean>(false)
    const [playing, setPlaying] = useState<boolean>(false)
    const [songs, setSongs] = useState<SongAndTitle[]>([])
    const [currentSong, setCurrentSong] = useState<number>(0)
    const [mode, setMode] = useState<Mode>('LOOP_LIST')

    useEffect(() => {
        (async () => {
            const result = await fetch('assets/audio-atlas-music.json')

            const audioAtlasSongs: AudioAtlasSongs[] = await result.json()

            const newSongs = audioAtlasSongs?.map(newSong => { return { title: newSong.title, song: new Audio(newSong.path) } })

            setSongs(newSongs)
        })().then()

        return () => { }
    }, [])

    useEffect(() => {
        if (songs !== undefined && currentSong !== undefined && songs[currentSong] !== undefined) {
            songs[currentSong].song.volume = volume
        }

        return () => { }
    }, [songs, currentSong, volume])

    useEffect(() => {
        if (songs && currentSong) {
            songs[currentSong].song.onended = () => next(currentSong, mode, songs, volume)
        }

        return () => { }
    }, [mode, currentSong, songs, volume])

    function pause(songToPause: number, songs: SongAndTitle[]) {
        if (songs) {
            songs[songToPause].song.pause()

            setPlaying(false)
        }
    }

    function resume(songToResume: number, mode: Mode, songs: SongAndTitle[], volume: number) {
        if (songs) {
            songs[songToResume].song.volume = volume
            songs[songToResume].song.onended = () => { next(songToResume, mode, songs, volume) }
            songs[songToResume].song.play()

            setPlaying(true)
        }
    }

    function next(previous: number, mode: Mode, songs: SongAndTitle[], volume: number) {
        songs[previous].song.pause()

        let newSong = previous

        if (mode === 'LOOP_LIST') {
            newSong = (previous < songs.length - 1) ? previous + 1 : 0
        } else if (mode === 'SHUFFLE_LIST') {
            newSong = Math.floor(Math.random() * songs.length)

            if (newSong === previous) {
                newSong = (newSong < songs.length) ? newSong : 0
            }
        }

        if (playing) {
            songs[newSong].song.volume = volume
            songs[newSong].song.currentTime = 0
            songs[newSong].song.onended = () => { next(newSong, mode, songs, volume) }
            songs[newSong].song.play()
        }

        setCurrentSong(newSong)
    }

    function play(index: number, songs: SongAndTitle[], volume: number): void {
        songs[currentSong].song.pause()

        songs[index].song.volume = volume
        songs[index].song.currentTime = 0
        songs[index].song.onended = () => { next(index, mode, songs, volume) }
        songs[index].song.play()

        setPlaying(true)
        setCurrentSong(index)
    }

    return (
        <div className="music-player">
            <div> <b>Music</b></div>

            {playing && songs && expanded &&
                <div> Playing: {songs[currentSong].title} </div>
            }

            {expanded &&
                <>
                    <div>
                        {playing &&
                            <span><Button onClick={() => pause(currentSong, songs)} icon={<Pause24Filled />} appearance='transparent' /></span>
                        }

                        {!playing &&
                            <span><Button onClick={() => resume(currentSong, mode, songs, volume)} icon={<Play24Filled />} appearance='transparent' /></span>
                        }

                        <span><Button onClick={() => next(currentSong, mode, songs, volume)} icon={<FastForward24Filled />} appearance='transparent' /></span>
                    </div>

                    <div id="SongList">

                        {songs &&
                            songs.map(
                                (song, index) => {
                                    return (
                                        <div
                                            className={(index === currentSong) ? "PlayingSongItem" : "SongItem"}
                                            key={index}
                                            onClick={() => { play(index, songs, volume) }}
                                        >
                                            <div>{song.title}</div><div>{secondsToString(song.song.duration)}</div>
                                        </div>
                                    )
                                }
                            )
                        }
                    </div>
                    <Button appearance={mode === 'LOOP_SONG' ? 'secondary' : 'transparent'} onClick={() => setMode('LOOP_SONG')}>Loop song</Button>
                    <Button appearance={mode === 'LOOP_LIST' ? 'secondary' : 'transparent'} onClick={() => setMode('LOOP_LIST')}>Loop list</Button>
                    <Button appearance={mode === 'SHUFFLE_LIST' ? 'secondary' : 'transparent'} onClick={() => setMode('SHUFFLE_LIST')}>Shuffle</Button>
                </>
            }

            <ExpandCollapseToggle onExpand={() => setExpanded(true)} onCollapse={() => setExpanded(false)} inverted />
        </div>
    )
}

function secondsToString(seconds: number): string {
    const minutes = Math.floor(seconds / 60.0)
    const secondsDisplay = (seconds - minutes * 60).toFixed(0)

    return `${minutes}:${secondsDisplay}`
}

export default MusicPlayer