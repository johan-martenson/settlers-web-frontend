import React, { useEffect, useState } from 'react'
import { Button } from '@fluentui/react-components'
import ExpandCollapseToggle from '../components/expand_collapse_toggle/expand_collapse_toggle'
import './music_player.css'
import { FastForward24Filled, Pause24Filled, Play24Filled } from '@fluentui/react-icons'
import { ItemContainer } from '../components/item_container'

// Types
type AudioAtlasSongs = {
    path: string
    title: string
}

type SongAndTitle = {
    title: string
    song: HTMLAudioElement
}

type MusicPlayerProps = {
    volume: number
}

type Mode = 'LOOP_SONG' | 'LOOP_LIST' | 'SHUFFLE_LIST'

// Constants
const DEFAULT_MODE: Mode = 'LOOP_LIST'
const SELECTED_COLOR = 'lightblue'

// React components
const MusicPlayer = ({ volume }: MusicPlayerProps) => {
    const [expanded, setExpanded] = useState<boolean>(false)
    const [playing, setPlaying] = useState<boolean>(false)
    const [songs, setSongs] = useState<SongAndTitle[]>([])
    const [currentSong, setCurrentSong] = useState<number>(0)
    const [mode, setMode] = useState<Mode>(DEFAULT_MODE)

    useEffect(() => {
        (async () => {
            const result = await fetch('assets/audio-atlas-music.json')
            const audioAtlasSongs: AudioAtlasSongs[] = await result.json()
            const newSongs = audioAtlasSongs?.map(newSong => {
                return {
                    title: newSong.title,
                    song: new Audio(newSong.path)
                }
            })

            setSongs(newSongs)
        })()
    }, [])

    useEffect(() => {
        if (currentSong !== undefined && songs[currentSong] !== undefined) {
            songs[currentSong].song.volume = volume
        }
    }, [songs, currentSong, volume])

    useEffect(() => {
        if (songs && currentSong) {
            songs[currentSong].song.onended = () => next(currentSong, mode, songs, volume)
        }
    }, [mode, currentSong, songs, volume])

    function pause(songToPause: number, songs: SongAndTitle[]): void {
        songs[songToPause].song.pause()

        setPlaying(false)
    }

    function resume(songToResume: number, mode: Mode, songs: SongAndTitle[], volume: number): void {
        songs[songToResume].song.volume = volume
        songs[songToResume].song.onended = () => { next(songToResume, mode, songs, volume) }
        songs[songToResume].song.play()

        setPlaying(true)
    }

    function next(previous: number, mode: Mode, songs: SongAndTitle[], volume: number): void {
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
        <div className='music-player' onWheel={(event) => event.stopPropagation()}>
            <div className='music-player-content'>
                <div><b>Music</b></div>

                {playing && songs && expanded &&
                    <div> Playing: {songs[currentSong].title} </div>
                }

                {expanded &&
                    <>
                        <div>
                            {playing ?
                                <span><Button onClick={() => pause(currentSong, songs)} icon={<Pause24Filled />} appearance='transparent' /></span>
                                :
                                <span><Button onClick={() => resume(currentSong, mode, songs, volume)} icon={<Play24Filled />} appearance='transparent' /></span>
                            }
                            <span><Button onClick={() => next(currentSong, mode, songs, volume)} icon={<FastForward24Filled />} appearance='transparent' /></span>
                        </div>

                        <ItemContainer>
                            {songs.map((song, index) => (
                                <div
                                    key={index}
                                    className={(index === currentSong) ? 'playing-song-item' : 'song-item'}
                                    onClick={() => { play(index, songs, volume) }}
                                >
                                    <div>{song.title}</div>
                                    <div>{secondsToString(song.song.duration)}</div>
                                </div>
                            ))}
                        </ItemContainer>
                        <div>
                            <Button style={{ backgroundColor: mode === 'LOOP_SONG' ? SELECTED_COLOR : undefined }} onClick={() => setMode('LOOP_SONG')}>Loop song</Button>
                            <Button style={{ backgroundColor: mode === 'LOOP_LIST' ? SELECTED_COLOR : undefined }} onClick={() => setMode('LOOP_LIST')}>Loop list</Button>
                            <Button style={{ backgroundColor: mode === 'SHUFFLE_LIST' ? SELECTED_COLOR : undefined }} onClick={() => setMode('SHUFFLE_LIST')}>Shuffle</Button>
                        </div>
                    </>
                }
            </div>
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