/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useEffect, useState } 	from 'react'
import { Canvas } 												from 'react-three-fiber'
// eslint-disable-next-line
import * as THREE 																															from "three"
import { Stars, TrackballControls }															from "drei"

let map = []
for (let i = 0; i < 10; i++) {
	map[i] = []
	for (let y = 0; y < 10; y++) {
		map[i][y] = 'e'
	}
}

function MoveWater(iteration, meshes) {
	console.log(meshes)
	//iterate through water to move
	for (const waterUnit of meshes.children) {
		let yPos = waterUnit.position.y
		let xPos = waterUnit.position.x
		//bool to now it will be able to go down
		let isBOk = 0
		let isROk = 0
		let isLOk = 0
		//check collision with others water unit
		
		if (map[xPos][yPos-1] === 'e') {
			isBOk = 1
		} else if (map[xPos][yPos+1] === 'water') {
			if (map[xPos+1]?.[yPos] === 'e') {
				if (map[xPos-1]?.[yPos] === 'e') {
					if (Math.random() >= 0.5)
						isROk = 1
					else
						isLOk = 1
				} else {
					isROk = 1
				}
			} else if (map[xPos-1]?.[yPos] === 'e') {
				isLOk = 1
			}
		}
		
		//check collision with grounds
		

		//remove from map
		map[xPos][yPos] = 'e'
		//move down
		waterUnit.position.y = Math.min(10, Math.max(0, waterUnit.position.y - isBOk))
		waterUnit.position.x = Math.min(10, Math.max(0, waterUnit.position.x + isROk - isLOk))
		//read on map
		map[waterUnit.position.x][waterUnit.position.y] = 'water'
	}
}

function Waters(props) {
	const meshes = useRef()
	const { iteration } = props
	const tiles = [
		{x: 0, y: 10},
		{x: 1, y: 10},
		{x: 3, y: 10},
		{x: 4, y: 10},
		{x: 6, y: 10},
		{x: 7, y: 10},
		{x: 8, y: 10},
		{x: 9, y: 10},
		{x: 9, y: 10},
		{x: 0, y: 9},
		{x: 1, y: 9},
		{x: 2, y: 9},
		{x: 4, y: 9},
		{x: 5, y: 9},
		{x: 6, y: 9},
		{x: 7, y: 9},
		{x: 8, y: 9},
		{x: 1, y: 8},
		{x: 2, y: 8},
		{x: 3, y: 8},
		{x: 4, y: 8},
		{x: 5, y: 8},
		{x: 7, y: 8},
		{x: 9, y: 8},
		{x: 0, y: 7},
		{x: 1, y: 7},
		{x: 2, y: 7},
		{x: 3, y: 7},
		{x: 4, y: 7},
		{x: 6, y: 7},
		{x: 7, y: 7},
		{x: 8, y: 7},
		{x: 9, y: 7},
		{x: 5, y: 3},
		{x: 5, y: 5},
		{x: 5, y: 6},
	

		{x: 1, y: 4},
		{x: 3, y: 3},
		{x: 5, y: 2},
		{x: 7, y: 1},
		{x: 9, y: 0}
	]
	useEffect(() => {
		for (const g of tiles) {
			map[g.x][g.y] = 'water'
		}
	}, [])

	useEffect(() => {
		if (meshes.current) {
			for (const water of meshes.current.children) {
				water.material.transparent = true
				water.material.opacity = 0.5
			}
		}
	}, [meshes])

	useEffect(() => {
		if (iteration > 0) {
			MoveWater(iteration, meshes.current)
		}
	}, [iteration])

	return (<>
		<mesh ref={meshes}>
			{Object.keys(tiles).map((k, i) => (
				<mesh
					position={[tiles[k].x, tiles[k].y, 0]}
					key={i}
				>
					<boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
					<meshStandardMaterial attach="material" color="#409EFF" />
				</mesh>
			))}
		</mesh>
	</>)
}

function Grounds(props) {
	const tiles = [
		{x: 1, y: 1},
		{x: 1, y: 2},
		{x: 3, y: 1},
		{x: 3, y: 4},
		{x: 6, y: 0},
		{x: 6, y: 1},
		{x: 6, y: 2},
		{x: 6, y: 3},
		{x: 9, y: 4},
		{x: 9, y: 3},
		{x: 9, y: 2},
	]
	useEffect(() => {
		for (const g of tiles) {
			map[g.x][g.y] = 'ground'
		}
	}, [])
	

	return (<>
		<mesh>
			{Object.keys(tiles).map((k, i) => (
				<mesh
					position={[tiles[k].x, tiles[k].y, 0]}
					key={i}
				>
					<boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
					<meshStandardMaterial attach="material" color="#67C23A" />
				</mesh>
			))}
		</mesh>
	</>)
}

function Plane(props) {
	return (<>
		
			<mesh rotation={[4.71239, 0, 0]} position={[4.5, -0.5, -0.5]}>
				<planeBufferGeometry attach="geometry" args={[10, 10]} />
				<meshStandardMaterial attach="material" color="#737CA1" />
			</mesh>
		
	</>)
}

export default function Mod1() {
	const [iteration, setIteration] = useState(0)
	
	return (
		<div style={{width: '100%', height: '754px'}} >
			<button onClick={() => setIteration(iteration+1)} style={{position: 'absolute', zIndex: 10000}} type="button">Iteration!</button>
			<button onClick={() => console.log(map)} style={{position: 'absolute', zIndex: 10000, marginLeft: -50}} type="button">Map!</button>
			<Canvas colorManagement>
				<ambientLight intensity={0.5} color="#fff"/>

				<Waters iteration={iteration}/>
				<Grounds/>

				<Plane />

				<gridHelper args={[10, 10, `white`, `#409EFF`]} position={[4.5, -0.5, -0.5]}/>
				<gridHelper args={[10, 10, `white`, `#67C23A`]} rotation={[1.5708, 0, 0]} position={[4.5, -0.5, -0.5]}/>
				<Stars />
				<TrackballControls />
			</Canvas>
		</div>
	)
}
